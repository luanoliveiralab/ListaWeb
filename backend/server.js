require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const { pool, verificarConexao } = require("./src/db");
const { enviarEmailRecuperacao, enviarEmailVerificacao } = require("./src/email");
const { autenticar } = require("./src/middleware/autenticar");
const { cookieOptions, csrfCookieOptions, criarTokenCsrf, protegerCsrf, limitarTentativas, limparTentativas } = require("./src/security");
const recorrenciasRouter = require("./src/routes/recorrencias");
const metasRouter = require("./src/routes/metas");
const cartoesRouter = require("./src/routes/cartoes");
const categoriasRouter = require("./src/routes/categorias");
const { criarContextoRequisicao, rotaNaoEncontrada, tratarErro } = require("./src/http");
const { frontendUrlPrincipal, validarFotoDataUrl } = require("./src/validation");
const { buscarCartaoComUso, possuiLimite } = require("./src/credit");

const app = express();
const VALOR_MONETARIO_MAXIMO = 9_999_999_999.99;

function dataIsoValida(valor) {
    if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
    const data = new Date(`${valor}T12:00:00Z`);
    return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}
app.set("trust proxy", 1);
app.disable("x-powered-by");

// =====================================================
// CONFIGURAÇÕES
// =====================================================

const PORT = process.env.PORT || 3001;
// Mantido como configuração para reativar a confirmação sem alterar o código.
const exigeConfirmacaoEmail = process.env.EMAIL_CONFIRMATION_REQUIRED === "true";

if (!process.env.JWT_SECRET || (process.env.NODE_ENV === "production" && process.env.JWT_SECRET.length < 32)) {
    console.error("JWT_SECRET deve estar definido e ter ao menos 32 caracteres em produção.");
    process.exit(1);
}

// =====================================================
// MIDDLEWARE
// =====================================================

const origensPermitidas = (process.env.FRONTEND_URL || "http://localhost:3000")
    .split(",").map((origem) => origem.trim()).filter(Boolean);

app.use(
    cors({
        origin(origem, callback) {
            if (!origem || origensPermitidas.includes(origem)) return callback(null, true);
            return callback(new Error("Origem não permitida pelo CORS."));
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", "X-Request-Id"],
        exposedHeaders: ["X-Request-Id"],
        credentials: true,
    })
);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use((req, res, next) => {
    res.set("Cache-Control", "private, no-store");
    next();
});
app.use(express.json({ limit: "3mb" }));
app.use(criarContextoRequisicao);

app.get("/csrf", (req, res) => {
    const csrfToken = criarTokenCsrf();
    res.cookie("listaweb_csrf", csrfToken, csrfCookieOptions());
    return res.json({ csrfToken });
});

app.use(protegerCsrf);

// =====================================================
// AUTENTICAÇÃO
// =====================================================

verificarConexao()
    .then(() => console.log("Banco de dados conectado"))
    .catch((err) => console.error("Erro ao conectar ao banco:", err.message));

// =====================================================
// USUÁRIOS
// =====================================================

// =====================================================
// CADASTRO
// =====================================================

app.post("/cadastro", limitarTentativas(), async (req, res) => {
    const {
        nome,
        email,
        senha,
        aceitouTermos,
        versaoTermos,
    } = req.body;

    if (
        typeof nome !== "string" ||
        !nome.trim() ||
        nome.trim().length > 120 ||
        typeof email !== "string" ||
        !email.trim() ||
        typeof senha !== "string" ||
        !senha ||
        senha.length > 128
    ) {
        return res.status(400).json({
            mensagem: "Preencha todos os campos.",
        });
    }

    if (aceitouTermos !== true || versaoTermos !== "2026-08-10") {
        return res.status(400).json({
            mensagem: "É necessário aceitar os Termos de Uso e Privacidade.",
        });
    }

    const nomeLimpo = nome.trim();

    const emailLimpo = email
        .trim()
        .toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailLimpo) || emailLimpo.length > 255) {
        return res.status(400).json({ mensagem: "Informe um e-mail válido." });
    }

    if (senha.length < 10 || senha.length > 128) {
        return res.status(400).json({
            mensagem:
                "A senha deve ter entre 10 e 128 caracteres.",
        });
    }

    let usuarioIdCriado = null;

    try {
        const existe = await pool.query(
            `SELECT id
             FROM usuarios
             WHERE email = $1`,
            [emailLimpo]
        );

        if (existe.rows.length > 0) {
            return res.status(400).json({
                mensagem: "E-mail já cadastrado.",
            });
        }

        const senhaHash = await bcrypt.hash(
            senha,
            12
        );

        const result = await pool.query(
            `INSERT INTO usuarios (nome, email, senha, email_verificado, termos_aceitos_em, termos_versao)
             VALUES ($1, $2, $3, $4, NOW(), $5)
             RETURNING id, nome, email, foto`,
            [
                nomeLimpo,
                emailLimpo,
                senhaHash,
                !exigeConfirmacaoEmail,
                versaoTermos,
            ]
        );

        const usuario = result.rows[0];
        usuarioIdCriado = usuario.id;

        if (exigeConfirmacaoEmail) {
            const tokenVerificacao = crypto.randomBytes(32).toString("hex");
            const tokenHash = crypto.createHash("sha256").update(tokenVerificacao).digest("hex");
            await pool.query(
                `INSERT INTO verificacoes_email (usuario_id, token_hash, expira_em)
                 VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
                [usuario.id, tokenHash]
            );
            const frontendUrl = frontendUrlPrincipal();
            await enviarEmailVerificacao({
                destinatario: usuario.email,
                nome: usuario.nome,
                link: `${frontendUrl}/verificar-email?token=${tokenVerificacao}`,
            });
        }

        limparTentativas(req);
        const resposta = {
            mensagem: exigeConfirmacaoEmail ? "Usuário criado. Confirme seu e-mail para entrar." : "Usuário criado. Você já pode entrar.",
            email: usuario.email,
            email_verification_required: exigeConfirmacaoEmail,
        };

        if (!exigeConfirmacaoEmail) {
            const token = jwt.sign(
                { id: usuario.id, v: 0 },
                process.env.JWT_SECRET,
                { expiresIn: "8h" }
            );
            res.cookie("listaweb_token", token, cookieOptions());
            const csrfToken = criarTokenCsrf();
            res.cookie("listaweb_csrf", csrfToken, csrfCookieOptions());
            resposta.csrfToken = csrfToken;
            resposta.usuario = usuario;
        }

        return res.status(201).json(resposta);
    } catch (err) {
        if (usuarioIdCriado) {
            await pool.query("DELETE FROM usuarios WHERE id = $1", [usuarioIdCriado]).catch(() => undefined);
        }
        if (err?.code === "23505") {
            return res.status(409).json({ mensagem: "E-mail já cadastrado." });
        }
        console.error(
            "Erro no cadastro:",
            err
        );

        return res.status(500).json({
            mensagem: "Erro no cadastro.",
        });
    }
});

app.post("/verificar-email", limitarTentativas({ limite: 10, janelaMs: 30 * 60 * 1000 }), async (req, res) => {
    const token = typeof req.body.token === "string" ? req.body.token : "";
    if (!/^[a-f0-9]{64}$/.test(token)) {
        return res.status(400).json({ mensagem: "Link de confirmação inválido." });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const verificacao = await client.query(
            `SELECT id, usuario_id FROM verificacoes_email
             WHERE token_hash = $1 AND usado_em IS NULL AND expira_em > NOW()
             FOR UPDATE`,
            [tokenHash]
        );
        if (!verificacao.rowCount) {
            await client.query("ROLLBACK");
            return res.status(400).json({ mensagem: "Este link é inválido ou expirou." });
        }

        await client.query("UPDATE usuarios SET email_verificado = TRUE WHERE id = $1", [verificacao.rows[0].usuario_id]);
        await client.query("UPDATE verificacoes_email SET usado_em = NOW() WHERE id = $1", [verificacao.rows[0].id]);
        await client.query("COMMIT");
        limparTentativas(req);
        return res.json({ mensagem: "E-mail confirmado com sucesso!" });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Erro ao confirmar e-mail:", err);
        return res.status(500).json({ mensagem: "Não foi possível confirmar o e-mail." });
    } finally {
        client.release();
    }
});

// =====================================================
// LOGIN
// =====================================================

app.post("/login", limitarTentativas(), async (req, res) => {
    const {
        email,
        senha,
    } = req.body;

    if (
        typeof email !== "string" ||
        !email.trim() ||
        email.trim().length > 255 ||
        typeof senha !== "string" ||
        !senha ||
        senha.length > 128
    ) {
        return res.status(400).json({
            mensagem:
                "Informe o e-mail e a senha.",
        });
    }

    try {
        const result = await pool.query(
            `SELECT id, nome, email, foto, senha, token_version, email_verificado
             FROM usuarios
             WHERE email = $1`,
            [
                email
                    .trim()
                    .toLowerCase(),
            ]
        );

        if (result.rows.length === 0) {
            await bcrypt.hash(senha, 12);
            return res.status(401).json({
                mensagem:
                    "E-mail ou senha incorretos.",
            });
        }

        const user = result.rows[0];

        const senhaValida = typeof user.senha === "string" && user.senha.startsWith("$2")
            ? await bcrypt.compare(
                senha,
                user.senha
            )
            : false;

        if (!senhaValida) {
            return res.status(401).json({
                mensagem: "E-mail ou senha incorretos.",
            });
        }

        if (exigeConfirmacaoEmail && !user.email_verificado) {
            return res.status(403).json({ mensagem: "Confirme seu e-mail antes de entrar." });
        }

        const token = jwt.sign(
            { id: user.id, v: user.token_version },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        res.cookie("listaweb_token", token, cookieOptions());
        const csrfToken = criarTokenCsrf();
        res.cookie("listaweb_csrf", csrfToken, csrfCookieOptions());
        limparTentativas(req);

        return res.json({
            mensagem: "Login OK.",
            csrfToken,
            usuario: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                foto: user.foto,
            },
        });
    } catch (err) {
        console.error(
            "Erro no login:",
            err
        );

        return res.status(500).json({
            mensagem: "Erro no login.",
        });
    }
});

// =====================================================
// ATUALIZAR USUÁRIO
// =====================================================

app.post("/logout", (req, res) => {
    const options = cookieOptions();
    delete options.maxAge;
    res.clearCookie("listaweb_token", options);
    res.clearCookie("listaweb_csrf", csrfCookieOptions());
    return res.json({ mensagem: "Sessão encerrada." });
});

app.post("/esqueci-senha", limitarTentativas({ limite: 4, janelaMs: 30 * 60 * 1000 }), async (req, res) => {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const resposta = { mensagem: "Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação." };
    if (!email || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        return res.status(400).json({ mensagem: "Informe um e-mail válido." });
    }

    try {
        const usuarioResult = await pool.query("SELECT id, nome, email FROM usuarios WHERE LOWER(email) = LOWER($1)", [email]);
        if (!usuarioResult.rowCount) {
            return res.status(404).json({ mensagem: "E-mail não cadastrado." });
        }

        const usuario = usuarioResult.rows[0];
        const token = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        await pool.query("DELETE FROM recuperacoes_senha WHERE usuario_id = $1 OR expira_em < NOW()", [usuario.id]);
        await pool.query(
            "INSERT INTO recuperacoes_senha (usuario_id, token_hash, expira_em) VALUES ($1, $2, NOW() + INTERVAL '30 minutes')",
            [usuario.id, tokenHash]
        );

        const link = `${frontendUrlPrincipal()}/redefinir-senha?token=${token}`;
        await enviarEmailRecuperacao({
            destinatario: usuario.email,
            nome: usuario.nome,
            link,
        });
        return res.json(resposta);
    } catch (err) {
        console.error("Erro ao solicitar recuperação:", err);
        return res.status(500).json({ mensagem: "Não foi possível processar a recuperação." });
    }
});

app.post("/redefinir-senha", limitarTentativas({ limite: 6, janelaMs: 30 * 60 * 1000 }), async (req, res) => {
    const { token, novaSenha } = req.body;
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token) || typeof novaSenha !== "string" || novaSenha.length < 10 || novaSenha.length > 128) {
        return res.status(400).json({ mensagem: "Link ou nova senha inválidos." });
    }
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const recuperacao = await client.query(
            `SELECT id, usuario_id FROM recuperacoes_senha
             WHERE token_hash = $1 AND usado_em IS NULL AND expira_em > NOW() FOR UPDATE`,
            [tokenHash]
        );
        if (!recuperacao.rowCount) {
            await client.query("ROLLBACK");
            return res.status(400).json({ mensagem: "Este link é inválido ou expirou." });
        }
        const senhaHash = await bcrypt.hash(novaSenha, 12);
        await client.query("UPDATE usuarios SET senha = $1, token_version = token_version + 1 WHERE id = $2", [senhaHash, recuperacao.rows[0].usuario_id]);
        await client.query("UPDATE recuperacoes_senha SET usado_em = NOW() WHERE id = $1", [recuperacao.rows[0].id]);
        await client.query("COMMIT");
        return res.json({ mensagem: "Senha redefinida com sucesso." });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Erro ao redefinir senha:", err);
        return res.status(500).json({ mensagem: "Não foi possível redefinir a senha." });
    } finally { client.release(); }
});

app.get("/me", autenticar, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, nome, email, foto FROM usuarios WHERE id = $1",
            [req.usuarioId]
        );
        if (!result.rowCount) return res.status(401).json({ mensagem: "Sessão inválida.", codigo: "SESSAO_INVALIDA" });
        return res.json(result.rows[0]);
    } catch (err) {
        console.error("Erro ao validar sessão:", err);
        return res.status(500).json({ mensagem: "Erro ao validar sessão." });
    }
});

app.put(
    "/usuarios/:id",
    autenticar,
    async (req, res) => {
        const { id } = req.params;

        const {
            nome,
            email,
            senhaAtual,
        } = req.body;

        const usuarioId = Number(id);

        if (
            !Number.isInteger(usuarioId) ||
            usuarioId <= 0
        ) {
            return res.status(400).json({
                mensagem:
                    "ID do usuário inválido.",
            });
        }

        if (
            usuarioId !== req.usuarioId
        ) {
            return res.status(403).json({
                mensagem:
                    "Você não pode alterar outro usuário.",
            });
        }

        if (
            typeof nome !== "string" ||
            !nome.trim() ||
            typeof email !== "string" ||
            !email.trim()
        ) {
            return res.status(400).json({
                mensagem:
                    "Nome e e-mail são obrigatórios.",
            });
        }

        const nomeLimpo = nome.trim();
        const emailLimpo = email.trim().toLowerCase();
        if (nomeLimpo.length > 120 || emailLimpo.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailLimpo)) {
            return res.status(400).json({ mensagem: "Informe um nome e um e-mail válidos." });
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const atual = await client.query(
                "SELECT email, senha FROM usuarios WHERE id = $1 FOR UPDATE",
                [usuarioId]
            );
            if (!atual.rowCount) {
                await client.query("ROLLBACK");
                return res.status(404).json({ mensagem: "Usuário não encontrado." });
            }
            const emailMudou = atual.rows[0].email.toLowerCase() !== emailLimpo;
            if (emailMudou) {
                if (typeof senhaAtual !== "string" || !senhaAtual || senhaAtual.length > 128) {
                    await client.query("ROLLBACK");
                    return res.status(400).json({ mensagem: "Informe sua senha atual para alterar o e-mail." });
                }
                const senhaValida = typeof atual.rows[0].senha === "string" && atual.rows[0].senha.startsWith("$2")
                    ? await bcrypt.compare(senhaAtual, atual.rows[0].senha)
                    : false;
                if (!senhaValida) {
                    await client.query("ROLLBACK");
                    return res.status(400).json({ mensagem: "Senha atual incorreta." });
                }
            }

            const emailExistente =
                await client.query(
                    `SELECT id
                     FROM usuarios
                     WHERE LOWER(email) = LOWER($1)
                     AND id <> $2`,
                    [emailLimpo, usuarioId]
                );

            if (
                emailExistente.rowCount > 0
            ) {
                await client.query("ROLLBACK");
                return res.status(400).json({
                    mensagem:
                        "Este e-mail já está sendo usado.",
                });
            }

            const result =
                await client.query(
                    `UPDATE usuarios
                     SET nome = $1,
                         email = $2,
                         email_verificado = CASE WHEN $4 THEN FALSE ELSE email_verificado END,
                         token_version = token_version + CASE WHEN $4 THEN 1 ELSE 0 END
                     WHERE id = $3
                     RETURNING id, nome, email, foto`,
                    [nomeLimpo, emailLimpo, usuarioId, emailMudou]
                );

            if (
                result.rowCount === 0
            ) {
                await client.query("ROLLBACK");
                return res.status(404).json({
                    mensagem:
                        "Usuário não encontrado.",
                });
            }

            if (emailMudou) {
                const tokenVerificacao = crypto.randomBytes(32).toString("hex");
                const tokenHash = crypto.createHash("sha256").update(tokenVerificacao).digest("hex");
                await client.query("DELETE FROM verificacoes_email WHERE usuario_id = $1", [usuarioId]);
                await client.query(
                    `INSERT INTO verificacoes_email (usuario_id, token_hash, expira_em)
                     VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
                    [usuarioId, tokenHash]
                );
                await enviarEmailVerificacao({
                    destinatario: emailLimpo,
                    nome: nomeLimpo,
                    link: `${frontendUrlPrincipal()}/verificar-email?token=${tokenVerificacao}`,
                });
            }

            await client.query("COMMIT");
            if (emailMudou) {
                const options = cookieOptions();
                delete options.maxAge;
                res.clearCookie("listaweb_token", options);
                res.clearCookie("listaweb_csrf", csrfCookieOptions());
                return res.json({
                    usuario: result.rows[0],
                    email_verification_required: true,
                    mensagem: "Confirme o novo e-mail para entrar novamente.",
                });
            }
            return res.json(result.rows[0]);
        } catch (err) {
            await client.query("ROLLBACK").catch(() => undefined);
            if (err?.code === "23505") {
                return res.status(400).json({ mensagem: "Este e-mail já está sendo usado." });
            }
            console.error(
                "Erro ao atualizar usuário:",
                err
            );

            return res.status(500).json({
                mensagem:
                    "Erro ao atualizar usuário.",
            });
        } finally { client.release(); }
    }
);

// =====================================================
// EXCLUIR CONTA
// =====================================================

app.delete(
    "/usuarios/:id",
    autenticar,
    limitarTentativas({ limite: 5, janelaMs: 30 * 60 * 1000 }),
    async (req, res) => {
        const { id } = req.params;
        const { senhaAtual } = req.body;

        if (
            Number(id) !==
            req.usuarioId
        ) {
            return res.status(403).json({
                mensagem:
                    "Você não pode excluir outra conta.",
            });
        }

        if (typeof senhaAtual !== "string" || !senhaAtual || senhaAtual.length > 128) {
            return res.status(400).json({ mensagem: "Confirme sua senha atual para excluir a conta." });
        }

        const client =
            await pool.connect();

        try {
            await client.query("BEGIN");

            const usuarioAtual = await client.query(
                "SELECT senha FROM usuarios WHERE id = $1 FOR UPDATE",
                [req.usuarioId]
            );
            if (!usuarioAtual.rowCount) {
                await client.query("ROLLBACK");
                return res.status(404).json({ mensagem: "Usuário não encontrado." });
            }
            const senhaValida = typeof usuarioAtual.rows[0].senha === "string" && usuarioAtual.rows[0].senha.startsWith("$2")
                ? await bcrypt.compare(senhaAtual, usuarioAtual.rows[0].senha)
                : false;
            if (!senhaValida) {
                await client.query("ROLLBACK");
                return res.status(400).json({ mensagem: "Senha atual incorreta." });
            }

            await client.query(
                `DELETE FROM movimentacoes
                 WHERE usuario_id = $1`,
                [req.usuarioId]
            );

            await client.query(
                `DELETE FROM listas
                 WHERE usuario_id = $1`,
                [req.usuarioId]
            );

            await client.query(
                `DELETE FROM orcamentos
                 WHERE usuario_id = $1`,
                [req.usuarioId]
            );

            const result =
                await client.query(
                    `DELETE FROM usuarios
                     WHERE id = $1
                     RETURNING id`,
                    [req.usuarioId]
                );

            if (
                result.rowCount === 0
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res.status(404).json({
                    mensagem:
                        "Usuário não encontrado.",
                });
            }

            await client.query("COMMIT");
            limparTentativas(req);

            const options = cookieOptions();
            delete options.maxAge;
            res.clearCookie("listaweb_token", options);
            res.clearCookie("listaweb_csrf", csrfCookieOptions());

            return res.json({
                mensagem:
                    "Conta excluída com sucesso.",
            });
        } catch (err) {
            console.error(
                "Erro ao excluir conta:",
                err
            );

            await client.query(
                "ROLLBACK"
            );

            return res.status(500).json({
                mensagem:
                    "Erro ao excluir conta.",
            });
        } finally {
            client.release();
        }
    }
);

// =====================================================
// ATUALIZAR FOTO
// =====================================================

app.put(
    "/usuarios/:id/foto",
    autenticar,
    async (req, res) => {
        const { id } = req.params;

        const { foto } = req.body;

        const usuarioId = Number(id);

        if (
            !Number.isInteger(usuarioId) ||
            usuarioId <= 0
        ) {
            return res.status(400).json({
                mensagem:
                    "ID do usuário inválido.",
            });
        }

        if (
            usuarioId !== req.usuarioId
        ) {
            return res.status(403).json({
                mensagem:
                    "Você não pode alterar a foto de outro usuário.",
            });
        }

        try {
            validarFotoDataUrl(foto);
        } catch (error) {
            return res.status(error.status || 400).json({ mensagem: error.message, codigo: error.codigo });
        }

        try {
            const result =
                await pool.query(
                    `UPDATE usuarios
                     SET foto = $1
                     WHERE id = $2
                     RETURNING id, nome, email, foto`,
                    [
                        foto,
                        usuarioId,
                    ]
                );

            if (
                result.rowCount === 0
            ) {
                return res.status(404).json({
                    mensagem:
                        "Usuário não encontrado.",
                });
            }

            return res.json(
                result.rows[0]
            );
        } catch (err) {
            console.error(
                "Erro ao atualizar foto:",
                err
            );

            return res.status(500).json({
                mensagem:
                    "Erro ao atualizar foto.",
            });
        }
    }
);

// =====================================================
// REMOVER FOTO
// =====================================================

app.delete(
    "/usuarios/:id/foto",
    autenticar,
    async (req, res) => {
        const { id } = req.params;

        const usuarioId = Number(id);

        if (
            !Number.isInteger(usuarioId) ||
            usuarioId <= 0
        ) {
            return res.status(400).json({
                mensagem:
                    "ID do usuário inválido.",
            });
        }

        if (
            usuarioId !== req.usuarioId
        ) {
            return res.status(403).json({
                mensagem:
                    "Você não pode remover a foto de outro usuário.",
            });
        }

        try {
            const result =
                await pool.query(
                    `UPDATE usuarios
                     SET foto = NULL
                     WHERE id = $1
                     RETURNING id, nome, email, foto`,
                    [usuarioId]
                );

            if (
                result.rowCount === 0
            ) {
                return res.status(404).json({
                    mensagem:
                        "Usuário não encontrado.",
                });
            }

            return res.json(
                result.rows[0]
            );
        } catch (err) {
            console.error(
                "Erro ao remover foto:",
                err
            );

            return res.status(500).json({
                mensagem:
                    "Erro ao remover foto.",
            });
        }
    }
);

// =====================================================
// LISTA DE COMPRAS
// =====================================================

// =====================================================
// LISTAR ITENS
// =====================================================

app.get(
    "/lista/:usuarioId",
    autenticar,
    async (req, res) => {
        const usuarioId =
            Number(
                req.params.usuarioId
            );

        if (
            !Number.isInteger(usuarioId) ||
            usuarioId <= 0
        ) {
            return res.status(400).json({
                mensagem:
                    "ID do usuário inválido.",
            });
        }

        if (
            usuarioId !== req.usuarioId
        ) {
            return res.status(403).json({
                mensagem:
                    "Você não tem acesso a esta lista.",
            });
        }

        try {
            const result =
                await pool.query(
                    `SELECT
                        id,
                        nome,
                        quantidade,
                        categoria,
                        valor,
                        comprado,
                        movimentacao_id,
                        created_at
                     FROM listas
                     WHERE usuario_id = $1
                     ORDER BY id DESC`,
                    [usuarioId]
                );

            return res.json(
                result.rows
            );
        } catch (err) {
            console.error(
                "Erro ao buscar lista:",
                err
            );

            return res.status(500).json({
                mensagem:
                    "Erro ao buscar lista.",
            });
        }
    }
);

// =====================================================
// ADICIONAR ITEM
// =====================================================

app.post(
    "/lista",
    autenticar,
    async (req, res) => {
        const {
            nome,
            quantidade,
            categoria,
            valor,
        } = req.body;

        if (
            typeof nome !== "string" ||
            !nome.trim() ||
            nome.trim().length > 255
        ) {
            return res.status(400).json({
                mensagem:
                    "Nome do item é obrigatório.",
            });
        }

        if (
            quantidade !== undefined &&
            (
                !Number.isInteger(
                    quantidade
                ) ||
                quantidade <= 0
            )
        ) {
            return res.status(400).json({
                mensagem:
                    "Quantidade inválida.",
            });
        }

        if (
            valor !== undefined &&
            (
                typeof valor !== "number" ||
                !Number.isFinite(valor) ||
                valor < 0 ||
                valor > VALOR_MONETARIO_MAXIMO
            )
        ) {
            return res.status(400).json({
                mensagem:
                    "Valor inválido.",
            });
        }

        if (categoria !== undefined && (typeof categoria !== "string" || !categoria.trim() || categoria.trim().length > 80)) {
            return res.status(400).json({ mensagem: "Categoria inválida." });
        }

        try {
            const result =
                await pool.query(
                    `INSERT INTO listas
                        (
                            usuario_id,
                            nome,
                            quantidade,
                            categoria,
                            valor
                        )
                     VALUES
                        ($1, $2, $3, $4, $5)
                     RETURNING *`,
                    [
                        req.usuarioId,
                        nome.trim(),
                        quantidade ?? 1,
                        categoria ||
                            "Lista de Compras",
                        valor ?? 0,
                    ]
                );

            return res
                .status(201)
                .json(
                    result.rows[0]
                );
        } catch (err) {
            console.error(
                "Erro ao criar item:",
                err
            );

            return res.status(500).json({
                mensagem:
                    "Erro ao criar item.",
            });
        }
    }
);

// =====================================================
// ATUALIZAR ITEM
// =====================================================

app.put(
    "/lista/:id",
    autenticar,
    async (req, res) => {
        const { id } = req.params;

        const itemId = Number(id);

        if (
            !Number.isInteger(itemId) ||
            itemId <= 0
        ) {
            return res.status(400).json({
                mensagem:
                    "ID do item inválido.",
            });
        }

        const {
            comprado,
            nome,
            quantidade,
            categoria,
            valor,
            forma_pagamento,
            cartao_id,
        } = req.body;

        if (
            comprado === undefined &&
            nome === undefined &&
            quantidade === undefined &&
            categoria === undefined &&
            valor === undefined
        ) {
            return res.status(400).json({
                mensagem:
                    "Nenhum dado informado para atualização.",
            });
        }

        if (
            comprado !== undefined &&
            typeof comprado !== "boolean"
        ) {
            return res.status(400).json({
                mensagem:
                    "Status de compra inválido.",
            });
        }

        if (forma_pagamento !== undefined && !["saldo", "credito"].includes(forma_pagamento)) {
            return res.status(400).json({ mensagem: "Forma de pagamento inválida." });
        }

        if (
            nome !== undefined &&
            (
                typeof nome !== "string" ||
                !nome.trim() ||
                nome.trim().length > 255
            )
        ) {
            return res.status(400).json({
                mensagem:
                    "Nome inválido.",
            });
        }

        if (
            quantidade !== undefined &&
            (
                !Number.isInteger(
                    quantidade
                ) ||
                quantidade <= 0
            )
        ) {
            return res.status(400).json({
                mensagem:
                    "Quantidade inválida.",
            });
        }

        if (
            valor !== undefined &&
            (
                typeof valor !== "number" ||
                !Number.isFinite(valor) ||
                valor < 0 ||
                valor > VALOR_MONETARIO_MAXIMO
            )
        ) {
            return res.status(400).json({
                mensagem:
                    "Valor inválido.",
            });
        }

        if (categoria !== undefined && (typeof categoria !== "string" || !categoria.trim() || categoria.trim().length > 80)) {
            return res.status(400).json({ mensagem: "Categoria inválida." });
        }

        try {
            const itemResult =
                await pool.query(
                    `SELECT *
                     FROM listas
                     WHERE id = $1`,
                    [itemId]
                );

            if (
                itemResult.rowCount === 0
            ) {
                return res.status(404).json({
                    mensagem:
                        "Item não encontrado.",
                });
            }

            const item =
                itemResult.rows[0];

            if (
                Number(item.usuario_id) !==
                req.usuarioId
            ) {
                return res.status(403).json({
                    mensagem:
                        "Você não pode alterar este item.",
                });
            }

            if (
                item.comprado &&
                (comprado === false || nome !== undefined || quantidade !== undefined || categoria !== undefined || valor !== undefined)
            ) {
                return res.status(409).json({
                    mensagem: "Itens já comprados devem ser ajustados pelo lançamento em Finanças.",
                });
            }

            const cliente =
                await pool.connect();

            try {
                await cliente.query("BEGIN");

                const result =
                    await cliente.query(
                        `UPDATE listas
                         SET comprado =
                                COALESCE(
                                    $1,
                                    comprado
                                ),
                             nome =
                                COALESCE(
                                    $2,
                                    nome
                                ),
                             quantidade =
                                COALESCE(
                                    $3,
                                    quantidade
                                ),
                             categoria =
                                COALESCE(
                                    $4,
                                    categoria
                                ),
                             valor =
                                COALESCE(
                                    $5,
                                    valor
                                )
                         WHERE id = $6
                         RETURNING *`,
                        [
                            comprado,
                            nome !== undefined
                                ? nome.trim()
                                : undefined,
                            quantidade,
                            categoria,
                            valor,
                            itemId,
                        ]
                    );

                const itemAtualizado =
                    result.rows[0];

                // =================================================
                // CRIAR MOVIMENTAÇÃO QUANDO ITEM FOR COMPRADO
                // =================================================

                const acabouDeComprar =
                    comprado === true &&
                    !item.comprado;

                if (
                    acabouDeComprar &&
                    !item.movimentacao_id &&
                    Number(
                        itemAtualizado.valor
                    ) > 0
                ) {
                    const formaPagamento = forma_pagamento === "credito" ? "credito" : "saldo";
                    const cartaoId = formaPagamento === "credito" ? Number(cartao_id) : null;
                    if (formaPagamento === "credito" && (!Number.isInteger(cartaoId) || cartaoId <= 0)) {
                        await cliente.query("ROLLBACK");
                        return res.status(400).json({ mensagem: "Selecione um cartão válido." });
                    }
                    if (cartaoId) {
                        const cartao = await buscarCartaoComUso(cliente, req.usuarioId, cartaoId, { bloquear: true });
                        if (!cartao) { await cliente.query("ROLLBACK"); return res.status(400).json({ mensagem: "Cartão inválido." }); }
                        if (!possuiLimite(cartao, Number(itemAtualizado.valor))) {
                            await cliente.query("ROLLBACK");
                            return res.status(409).json({ mensagem: "Limite de crédito insuficiente neste cartão." });
                        }
                        const hoje = new Date();
                        const bloqueada = await cliente.query("SELECT 1 FROM faturas_cartao WHERE cartao_id = $1 AND ano = $2 AND mes = $3 AND status <> 'aberta'", [cartaoId, hoje.getFullYear(), hoje.getMonth() + 1]);
                        if (bloqueada.rowCount) { await cliente.query("ROLLBACK"); return res.status(400).json({ mensagem: "A fatura atual deste cartão já foi fechada." }); }
                    }
                    const movimentacao =
                        await cliente.query(
                            `INSERT INTO movimentacoes
                                (
                                    usuario_id,
                                    tipo,
                                    descricao,
                                    valor,
                                    categoria,
                                    forma_pagamento,
                                    cartao_id
                                )
                             VALUES
                                (
                                    $1,
                                    'despesa',
                                    $2,
                                    $3,
                                    $4,
                                    $5,
                                    $6
                                )
                             RETURNING id`,
                            [
                                req.usuarioId,
                                itemAtualizado.nome,
                                itemAtualizado.valor,
                                itemAtualizado.categoria ||
                                    "Lista de Compras",
                                formaPagamento,
                                cartaoId,
                            ]
                        );

                    const movimentacaoId =
                        movimentacao
                            .rows[0]
                            .id;

                    const itemFinal =
                        await cliente.query(
                            `UPDATE listas
                             SET movimentacao_id = $1
                             WHERE id = $2
                             RETURNING *`,
                            [
                                movimentacaoId,
                                itemId,
                            ]
                        );

                    await cliente.query("COMMIT");

                    return res.json(
                        itemFinal.rows[0]
                    );
                }

                // =================================================
                // SINCRONIZAR MOVIMENTAÇÃO EXISTENTE
                // =================================================

                if (
                    item.movimentacao_id
                ) {
                    await cliente.query(
                        `UPDATE movimentacoes
                         SET descricao = $1,
                             valor = $2,
                             categoria = $3
                         WHERE id = $4`,
                        [
                            itemAtualizado.nome,
                            itemAtualizado.valor,
                            itemAtualizado.categoria ||
                                "Lista de Compras",
                            item.movimentacao_id,
                        ]
                    );
                }

                await cliente.query("COMMIT");

                return res.json(
                    itemAtualizado
                );
            } catch (err) {
                await cliente.query(
                    "ROLLBACK"
                );

                throw err;
            } finally {
                cliente.release();
            }
        } catch (err) {
            console.error(
                "Erro ao atualizar item:",
                err
            );

            return res.status(500).json({
                mensagem:
                    "Erro ao atualizar item.",
            });
        }
    }
);

// =====================================================
// DELETAR ITEM
// =====================================================

app.delete(
    "/lista/:id",
    autenticar,
    async (req, res) => {
        const itemId = Number(req.params.id);
        if (!Number.isInteger(itemId) || itemId <= 0) {
            return res.status(400).json({ mensagem: "ID do item inválido." });
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const itemResult = await client.query(
                "SELECT * FROM listas WHERE id = $1 FOR UPDATE",
                [itemId]
            );
            if (!itemResult.rowCount) {
                await client.query("ROLLBACK");
                return res.status(404).json({ mensagem: "Item não encontrado." });
            }
            const item = itemResult.rows[0];
            if (Number(item.usuario_id) !== req.usuarioId) {
                await client.query("ROLLBACK");
                return res.status(403).json({ mensagem: "Você não pode excluir este item." });
            }

            if (item.movimentacao_id) {
                const movimentacao = await client.query(
                    `SELECT id, usuario_id, forma_pagamento, cartao_id, data
                     FROM movimentacoes WHERE id = $1 FOR UPDATE`,
                    [item.movimentacao_id]
                );
                const vinculada = movimentacao.rows[0];
                if (vinculada && vinculada.forma_pagamento === "credito" && vinculada.cartao_id) {
                    const faturaProtegida = await client.query(
                        `SELECT 1 FROM faturas_cartao
                         WHERE cartao_id = $1
                           AND ano = EXTRACT(YEAR FROM $2::date)
                           AND mes = EXTRACT(MONTH FROM $2::date)
                           AND status <> 'aberta'`,
                        [vinculada.cartao_id, vinculada.data]
                    );
                    if (faturaProtegida.rowCount) {
                        await client.query("ROLLBACK");
                        return res.status(409).json({
                            mensagem: "Este item pertence a uma fatura fechada ou paga e não pode ser excluído.",
                        });
                    }
                }
            }

            const result = await client.query("DELETE FROM listas WHERE id = $1 RETURNING *", [itemId]);
            if (item.movimentacao_id) {
                await client.query(
                    "DELETE FROM movimentacoes WHERE id = $1 AND usuario_id = $2",
                    [item.movimentacao_id, req.usuarioId]
                );
            }
            await client.query("COMMIT");
            return res.json({ mensagem: "Item e lançamento financeiro removidos com sucesso.", item: result.rows[0] });
        } catch (err) {
            await client.query("ROLLBACK").catch(() => undefined);
            console.error(
                "Erro ao excluir item:",
                err
            );

            return res.status(500).json({
                mensagem:
                    "Erro ao excluir item.",
            });
        } finally { client.release(); }
    }
);

// =====================================================
// FINANÇAS / MOVIMENTAÇÕES
// =====================================================

app.get("/dashboard", autenticar, async (req, res) => {
    const hoje = new Date();
    const mes = Number(req.query.mes ?? hoje.getMonth() + 1);
    const ano = Number(req.query.ano ?? hoje.getFullYear());

    if (!Number.isInteger(mes) || mes < 1 || mes > 12 ||
        !Number.isInteger(ano) || ano < 2000 || ano > 2200) {
        return res.status(400).json({ mensagem: "Período inválido." });
    }

    try {
        const [lista, movimentacoes, cartoes, saldoAnterior] = await Promise.all([
            pool.query(
                `SELECT
                    id, nome, quantidade, categoria, valor,
                    comprado, movimentacao_id, created_at
                 FROM listas
                 WHERE usuario_id = $1
                   AND created_at >= make_date($2, $3, 1)
                   AND created_at < make_date($2, $3, 1) + INTERVAL '1 month'
                 ORDER BY id DESC`,
                [req.usuarioId, ano, mes]
            ),
            pool.query(
                `SELECT
                    m.*,
                    l.quantidade AS quantidade
                 FROM movimentacoes m
                 LEFT JOIN listas l ON l.movimentacao_id = m.id
                 WHERE m.usuario_id = $1
                   AND m.data >= make_date($2, $3, 1)
                   AND m.data < make_date($2, $3, 1) + INTERVAL '1 month'
                 ORDER BY m.data DESC, m.id DESC`,
                [req.usuarioId, ano, mes]
            ),
            pool.query(
                `SELECT c.*,
                        COALESCE((
                            SELECT SUM(m.valor) FROM movimentacoes m
                            WHERE m.usuario_id = c.usuario_id AND m.cartao_id = c.id
                              AND m.tipo = 'despesa' AND m.forma_pagamento = 'credito'
                              AND NOT EXISTS (
                                  SELECT 1 FROM faturas_cartao f
                                  WHERE f.cartao_id = m.cartao_id AND f.usuario_id = m.usuario_id
                                    AND f.ano = EXTRACT(YEAR FROM m.data)::integer
                                    AND f.mes = EXTRACT(MONTH FROM m.data)::integer
                                    AND f.status = 'paga'
                              )
                        ), 0)::numeric(12,2) AS limite_utilizado
                 FROM cartoes c
                 WHERE c.usuario_id = $1
                 ORDER BY c.created_at DESC, c.id DESC`,
                [req.usuarioId]
            ),
            pool.query(
                `SELECT COALESCE(SUM(CASE
                    WHEN tipo = 'receita' THEN valor
                    WHEN tipo = 'despesa' AND forma_pagamento = 'saldo' THEN -valor
                    ELSE 0 END), 0)::numeric(12,2) AS saldo
                 FROM movimentacoes
                 WHERE usuario_id = $1 AND data < make_date($2, $3, 1)`,
                [req.usuarioId, ano, mes]
            ),
        ]);

        return res.json({
            lista: lista.rows,
            movimentacoes: movimentacoes.rows,
            cartoes: cartoes.rows,
            saldo_anterior: saldoAnterior.rows[0].saldo,
        });
    } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
        return res.status(500).json({
            mensagem: "Erro ao carregar dashboard.",
        });
    }
});

// =====================================================
// LISTAR MOVIMENTAÇÕES
// =====================================================

app.get("/financas/programadas", autenticar, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.*, c.nome AS cartao_nome
             FROM movimentacoes_programadas p
             LEFT JOIN cartoes c ON c.id = p.cartao_id
             WHERE p.usuario_id = $1 AND p.lancada_em IS NULL AND p.data_programada >= CURRENT_DATE
             ORDER BY p.data_programada ASC, p.id ASC`,
            [req.usuarioId]
        );
        return res.json(result.rows);
    } catch (err) {
        console.error("Erro ao buscar movimentações programadas:", err);
        return res.status(500).json({ mensagem: "Erro ao buscar movimentações programadas." });
    }
});

app.get(
    "/financas/:usuarioId",
    autenticar,
    async (req, res) => {
        const usuarioId =
            Number(
                req.params.usuarioId
            );

        if (
            !Number.isInteger(usuarioId) ||
            usuarioId <= 0
        ) {
            return res.status(400).json({
                mensagem:
                    "ID do usuário inválido.",
            });
        }

        if (
            usuarioId !== req.usuarioId
        ) {
            return res.status(403).json({
                mensagem:
                    "Você não tem acesso a estas movimentações.",
            });
        }

        try {
            const result =
                await pool.query(
                    `SELECT
                        m.*,
                        l.quantidade AS quantidade,
                        c.nome AS cartao_nome
                     FROM movimentacoes m
                     LEFT JOIN listas l
                        ON l.movimentacao_id = m.id
                     LEFT JOIN cartoes c ON c.id = m.cartao_id
                     WHERE m.usuario_id = $1
                     ORDER BY
                        m.data DESC,
                        m.id DESC`,
                    [usuarioId]
                );

            return res.json(
                result.rows
            );
        } catch (err) {
            console.error(
                "Erro ao buscar movimentações:",
                err
            );

            return res.status(500).json({
                mensagem:
                    "Erro ao buscar movimentações.",
            });
        }
    }
);

// =====================================================
// ADICIONAR MOVIMENTAÇÃO
// =====================================================

app.post(
    "/financas",
    autenticar,
    async (req, res) => {
        const {
            tipo,
            descricao,
            valor,
            categoria,
            data,
            forma_pagamento,
            cartao_id,
            parcelas,
        } = req.body;

        if (
            typeof tipo !== "string" ||
            ![
                "receita",
                "despesa",
            ].includes(tipo) ||
            typeof descricao !== "string" ||
            !descricao.trim() ||
            descricao.trim().length > 255 ||
            typeof categoria !== "string" ||
            !categoria.trim() ||
            categoria.trim().length > 80 ||
            typeof valor !== "number" ||
            !Number.isFinite(valor) ||
            valor <= 0 ||
            valor > VALOR_MONETARIO_MAXIMO ||
            (data !== undefined && data !== null && data !== "" && !dataIsoValida(data))
        ) {
            return res.status(400).json({
                mensagem:
                    "Dados da movimentação inválidos.",
            });
        }

        if (forma_pagamento !== undefined && !["saldo", "credito"].includes(forma_pagamento)) {
            return res.status(400).json({ mensagem: "Forma de pagamento inválida." });
        }
        const formaPagamento = tipo === "despesa" && forma_pagamento === "credito" ? "credito" : "saldo";
        const cartaoId = formaPagamento === "credito" ? Number(cartao_id) : null;
        const totalParcelas = formaPagamento === "credito" ? Number(parcelas ?? 1) : 1;
        if (formaPagamento === "credito" && (!Number.isInteger(cartaoId) || cartaoId <= 0)) {
            return res.status(400).json({ mensagem: "Selecione um cartão para a despesa no crédito." });
        }
        if (!Number.isInteger(totalParcelas) || totalParcelas < 1 || totalParcelas > 48) {
            return res.status(400).json({ mensagem: "A compra pode ter entre 1 e 48 parcelas." });
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            let cartaoNome = null;
            if (cartaoId) {
                const cartao = await buscarCartaoComUso(client, req.usuarioId, cartaoId, { bloquear: true });
                if (!cartao) { await client.query("ROLLBACK"); return res.status(400).json({ mensagem: "Cartão inválido." }); }
                if (!possuiLimite(cartao, valor)) {
                    await client.query("ROLLBACK");
                    return res.status(409).json({ mensagem: "Limite de crédito insuficiente neste cartão." });
                }
                cartaoNome = cartao.nome;
            }
            const dataBase = data ? new Date(`${data}T12:00:00Z`) : new Date();
            if (Number.isNaN(dataBase.getTime())) { await client.query("ROLLBACK"); return res.status(400).json({ mensagem: "Data inválida." }); }
            const grupoParcelamento = totalParcelas > 1 ? crypto.randomUUID() : null;
            const totalCentavos = Math.round(valor * 100);
            const baseCentavos = Math.floor(totalCentavos / totalParcelas);
            const restante = totalCentavos - baseCentavos * totalParcelas;
            const criadas = [];

            for (let indice = 0; indice < totalParcelas; indice += 1) {
                const primeiroDia = new Date(Date.UTC(dataBase.getUTCFullYear(), dataBase.getUTCMonth() + indice, 1));
                const ultimoDia = new Date(Date.UTC(primeiroDia.getUTCFullYear(), primeiroDia.getUTCMonth() + 1, 0)).getUTCDate();
                const dia = Math.min(dataBase.getUTCDate(), ultimoDia);
                const dataParcela = `${primeiroDia.getUTCFullYear()}-${String(primeiroDia.getUTCMonth() + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
                if (cartaoId) {
                    const bloqueada = await client.query(
                        "SELECT 1 FROM faturas_cartao WHERE cartao_id = $1 AND ano = $2 AND mes = $3 AND status <> 'aberta'",
                        [cartaoId, primeiroDia.getUTCFullYear(), primeiroDia.getUTCMonth() + 1]
                    );
                    if (bloqueada.rowCount) { await client.query("ROLLBACK"); return res.status(400).json({ mensagem: "Uma das parcelas pertence a uma fatura já fechada." }); }
                }
                const valorParcela = (baseCentavos + (indice < restante ? 1 : 0)) / 100;
                const result = await client.query(
                    `INSERT INTO movimentacoes
                        (
                            usuario_id,
                            tipo,
                            descricao,
                            valor,
                            categoria,
                            data,
                            forma_pagamento,
                            cartao_id,
                            grupo_parcelamento,
                            parcela_atual,
                            parcelas_total
                        )
                     VALUES
                        (
                            $1,
                            $2,
                            $3,
                            $4,
                            $5,
                            COALESCE(
                                $6,
                                CURRENT_DATE
                            ),
                            $7,
                            $8,
                            $9,
                            $10,
                            $11
                        )
                     RETURNING *`,
                    [
                        req.usuarioId,
                        tipo,
                        totalParcelas > 1 ? `${descricao.trim()} (${indice + 1}/${totalParcelas})` : descricao.trim(),
                        valorParcela,
                        categoria.trim(),
                        dataParcela,
                        formaPagamento,
                        cartaoId,
                        grupoParcelamento,
                        totalParcelas > 1 ? indice + 1 : null,
                        totalParcelas > 1 ? totalParcelas : null,
                    ]
                );
                result.rows[0].cartao_nome = cartaoNome;
                criadas.push(result.rows[0]);
            }
            await client.query("COMMIT");
            return res.status(201).json(totalParcelas > 1 ? { movimentacoes: criadas } : criadas[0]);
        } catch (err) {
            await client.query("ROLLBACK").catch(() => undefined);
            console.error(
                "Erro ao adicionar movimentação:",
                err
            );

            return res.status(500).json({
                mensagem:
                    "Erro ao adicionar movimentação.",
            });
        } finally {
            client.release();
        }
    }
);

// =====================================================
// ATUALIZAR MOVIMENTAÇÃO
// =====================================================

app.post("/financas/programar", autenticar, async (req, res) => {
    const { tipo, descricao, valor, categoria, data, forma_pagamento, cartao_id } = req.body;
    if (
        !["receita", "despesa"].includes(tipo) ||
        typeof descricao !== "string" || !descricao.trim() || descricao.trim().length > 255 ||
        typeof categoria !== "string" || !categoria.trim() || categoria.trim().length > 80 ||
        typeof valor !== "number" || !Number.isFinite(valor) || valor <= 0 || valor > VALOR_MONETARIO_MAXIMO ||
        !dataIsoValida(data) || data < new Date().toISOString().slice(0, 10) ||
        (forma_pagamento !== undefined && !["saldo", "credito"].includes(forma_pagamento))
    ) {
        return res.status(400).json({ mensagem: "Dados da movimentação programada inválidos." });
    }

    const formaPagamento = tipo === "despesa" && forma_pagamento === "credito" ? "credito" : "saldo";
    const cartaoId = formaPagamento === "credito" ? Number(cartao_id) : null;
    if (formaPagamento === "credito" && (!Number.isInteger(cartaoId) || cartaoId <= 0)) {
        return res.status(400).json({ mensagem: "Selecione um cartão para a despesa no crédito." });
    }

    try {
        if (cartaoId) {
            const cartao = await pool.query("SELECT id FROM cartoes WHERE id = $1 AND usuario_id = $2", [cartaoId, req.usuarioId]);
            if (!cartao.rowCount) return res.status(400).json({ mensagem: "Cartão inválido." });
        }
        const result = await pool.query(
            `INSERT INTO movimentacoes_programadas
                (usuario_id, tipo, descricao, valor, categoria, data_programada, forma_pagamento, cartao_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             RETURNING *`,
            [req.usuarioId, tipo, descricao.trim(), valor, categoria.trim(), data, formaPagamento, cartaoId]
        );
        return res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Erro ao programar movimentação:", err);
        return res.status(500).json({ mensagem: "Erro ao programar movimentação." });
    }
});

app.delete("/financas/programar/:id", autenticar, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ mensagem: "Programação inválida." });
    try {
        const result = await pool.query(
            "DELETE FROM movimentacoes_programadas WHERE id = $1 AND usuario_id = $2 AND lancada_em IS NULL RETURNING id",
            [id, req.usuarioId]
        );
        if (!result.rowCount) return res.status(404).json({ mensagem: "Programação não encontrada." });
        return res.json({ mensagem: "Movimentação programada cancelada." });
    } catch (err) {
        console.error("Erro ao cancelar movimentação programada:", err);
        return res.status(500).json({ mensagem: "Erro ao cancelar movimentação programada." });
    }
});

app.put(
    "/financas/:id",
    autenticar,
    async (req, res) => {
        const { id } = req.params;

        const movimentacaoId =
            Number(id);

        if (
            !Number.isInteger(
                movimentacaoId
            ) ||
            movimentacaoId <= 0
        ) {
            return res.status(400).json({
                mensagem:
                    "ID da movimentação inválido.",
            });
        }

        const {
            tipo,
            descricao,
            valor,
            categoria,
            data,
            quantidade,
            forma_pagamento,
            cartao_id,
        } = req.body;

        // =================================================
        // VALIDAÇÕES
        // =================================================

        if (
            typeof tipo !== "string" ||
            ![
                "receita",
                "despesa",
            ].includes(tipo)
        ) {
            return res.status(400).json({
                mensagem:
                    "Tipo de movimentação inválido.",
            });
        }

        if (
            typeof descricao !== "string" ||
            !descricao.trim() ||
            descricao.trim().length > 255
        ) {
            return res.status(400).json({
                mensagem:
                    "Descrição inválida.",
            });
        }

        if (
            typeof categoria !== "string" ||
            !categoria.trim() ||
            categoria.trim().length > 80
        ) {
            return res.status(400).json({
                mensagem:
                    "Categoria inválida.",
            });
        }

        if (
            typeof valor !== "number" ||
            !Number.isFinite(valor) ||
            valor <= 0 ||
            valor > VALOR_MONETARIO_MAXIMO
        ) {
            return res.status(400).json({
                mensagem:
                    "Valor inválido.",
            });
        }

        if (!dataIsoValida(data)) {
            return res.status(400).json({
                mensagem:
                    "Data da movimentação é obrigatória.",
            });
        }

        if (forma_pagamento !== undefined && !["saldo", "credito"].includes(forma_pagamento)) {
            return res.status(400).json({ mensagem: "Forma de pagamento inválida." });
        }

        if (
            quantidade !== undefined &&
            quantidade !== null &&
            (
                !Number.isInteger(
                    quantidade
                ) ||
                quantidade <= 0
            )
        ) {
            return res.status(400).json({
                mensagem:
                    "Quantidade inválida.",
            });
        }

        // =================================================
        // TRANSAÇÃO
        // =================================================

        const client =
            await pool.connect();

        try {
            await client.query("BEGIN");

            // =================================================
            // BUSCAR MOVIMENTAÇÃO + LISTA VINCULADA
            // =================================================

            const movimentacaoResult =
                await client.query(
                    `SELECT
                        m.*,
                        l.id AS lista_id,
                        l.quantidade AS lista_quantidade
                     FROM movimentacoes m
                     LEFT JOIN listas l
                        ON l.movimentacao_id = m.id
                     WHERE m.id = $1
                     FOR UPDATE OF m`,
                    [movimentacaoId]
                );

            if (
                movimentacaoResult.rowCount ===
                0
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res.status(404).json({
                    mensagem:
                        "Movimentação não encontrada.",
                });
            }

            const movimentacao =
                movimentacaoResult.rows[0];

            // =================================================
            // SEGURANÇA
            // =================================================

            if (
                Number(
                    movimentacao.usuario_id
                ) !==
                req.usuarioId
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res.status(403).json({
                    mensagem:
                        "Você não pode alterar esta movimentação.",
                });
            }

            if (movimentacao.fatura_pagamento_id) {
                await client.query("ROLLBACK");
                return res.status(409).json({ mensagem: "O pagamento de uma fatura não pode ser alterado." });
            }
            if (movimentacao.meta_movimentacao_id) {
                await client.query("ROLLBACK");
                return res.status(409).json({ mensagem: "Transferências de metas devem ser alteradas em Planejamento." });
            }
            if (movimentacao.forma_pagamento === "credito" && movimentacao.cartao_id) {
                await client.query("SELECT id FROM cartoes WHERE id = $1 AND usuario_id = $2 FOR UPDATE", [movimentacao.cartao_id, req.usuarioId]);
                const faturaProtegida = await client.query(
                    `SELECT 1 FROM faturas_cartao WHERE cartao_id = $1
                     AND ano = EXTRACT(YEAR FROM $2::date) AND mes = EXTRACT(MONTH FROM $2::date)
                     AND status <> 'aberta'`,
                    [movimentacao.cartao_id, movimentacao.data]
                );
                if (faturaProtegida.rowCount) {
                    await client.query("ROLLBACK");
                    return res.status(409).json({ mensagem: "Movimentações de uma fatura fechada ou paga não podem ser alteradas." });
                }
            }

            const formaPagamento = tipo === "despesa" && forma_pagamento === "credito" ? "credito" : "saldo";
            const cartaoId = formaPagamento === "credito" ? Number(cartao_id) : null;
            if (formaPagamento === "credito") {
                if (!Number.isInteger(cartaoId) || cartaoId <= 0) {
                    await client.query("ROLLBACK");
                    return res.status(400).json({ mensagem: "Selecione um cartão para a despesa no crédito." });
                }
                const cartao = await buscarCartaoComUso(client, req.usuarioId, cartaoId, {
                    bloquear: true,
                    ignorarMovimentacaoId: movimentacaoId,
                });
                if (!cartao) {
                    await client.query("ROLLBACK");
                    return res.status(400).json({ mensagem: "Cartão inválido." });
                }
                if (!possuiLimite(cartao, valor)) {
                    await client.query("ROLLBACK");
                    return res.status(409).json({ mensagem: "Limite de crédito insuficiente neste cartão." });
                }
                const faturaDestino = await client.query(
                    `SELECT 1 FROM faturas_cartao WHERE cartao_id = $1
                     AND ano = EXTRACT(YEAR FROM $2::date) AND mes = EXTRACT(MONTH FROM $2::date)
                     AND status <> 'aberta'`,
                    [cartaoId, data]
                );
                if (faturaDestino.rowCount) {
                    await client.query("ROLLBACK");
                    return res.status(409).json({ mensagem: "A fatura selecionada já foi fechada ou paga." });
                }
            }

            // =================================================
            // ATUALIZAR MOVIMENTAÇÃO
            // =================================================

            const result =
                await client.query(
                    `UPDATE movimentacoes
                     SET tipo = $1,
                         descricao = $2,
                         valor = $3,
                         categoria = $4,
                         data = $5,
                         forma_pagamento = $6,
                         cartao_id = $7
                     WHERE id = $8
                     RETURNING *`,
                    [
                        tipo,
                        descricao.trim(),
                        valor,
                        categoria.trim(),
                        data,
                        formaPagamento,
                        cartaoId,
                        movimentacaoId,
                    ]
                );

            if (
                result.rowCount === 0
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res.status(404).json({
                    mensagem:
                        "Movimentação não encontrada.",
                });
            }

            // =================================================
            // SE EXISTE ITEM DA LISTA VINCULADO
            // =================================================

            if (
                movimentacao.lista_id
            ) {
                const novaQuantidade =
                    quantidade !== undefined &&
                    quantidade !== null
                        ? quantidade
                        : movimentacao.lista_quantidade;

                /*
                 * IMPORTANTE:
                 *
                 * Os parâmetros são:
                 *
                 * $1 = descricao
                 * $2 = quantidade
                 * $3 = valor
                 * $4 = categoria
                 * $5 = movimentacaoId
                 *
                 * Portanto o WHERE usa corretamente $5.
                 */

                await client.query(
                    `UPDATE listas
                     SET nome = $1,
                         quantidade = $2,
                         valor = $3,
                         categoria = $4
                     WHERE movimentacao_id = $5`,
                    [
                        descricao.trim(),
                        novaQuantidade,
                        valor,
                        categoria.trim(),
                        movimentacaoId,
                    ]
                );
            }

            // =================================================
            // BUSCAR DADOS FINAIS
            // =================================================

            const finalResult =
                await client.query(
                    `SELECT
                        m.*,
                        l.quantidade AS quantidade,
                        c.nome AS cartao_nome
                     FROM movimentacoes m
                     LEFT JOIN listas l
                        ON l.movimentacao_id = m.id
                     LEFT JOIN cartoes c ON c.id = m.cartao_id
                     WHERE m.id = $1`,
                    [movimentacaoId]
                );

            await client.query("COMMIT");

            return res.json(
                finalResult.rows[0]
            );
        } catch (err) {
            await client.query(
                "ROLLBACK"
            );

            console.error(
                "Erro ao atualizar movimentação:",
                err
            );

            return res.status(500).json({
                mensagem:
                    "Erro ao atualizar movimentação.",
            });
        } finally {
            client.release();
        }
    }
);

// =====================================================
// DELETAR MOVIMENTAÇÃO
// =====================================================

app.delete(
    "/financas/:id",
    autenticar,
    async (req, res) => {
        const { id } = req.params;

        const movimentacaoId =
            Number(id);

        if (
            !Number.isInteger(
                movimentacaoId
            ) ||
            movimentacaoId <= 0
        ) {
            return res.status(400).json({
                mensagem:
                    "ID da movimentação inválido.",
            });
        }

        const client =
            await pool.connect();

        try {
            await client.query("BEGIN");

            const movimentacaoResult =
                await client.query(
                    `SELECT usuario_id, forma_pagamento, cartao_id, data, fatura_pagamento_id, meta_movimentacao_id
                     FROM movimentacoes
                     WHERE id = $1
                     FOR UPDATE`,
                    [movimentacaoId]
                );

            if (
                movimentacaoResult.rowCount ===
                0
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res.status(404).json({
                    mensagem:
                        "Movimentação não encontrada.",
                });
            }

            if (
                Number(
                    movimentacaoResult
                        .rows[0]
                        .usuario_id
                ) !==
                req.usuarioId
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res.status(403).json({
                    mensagem:
                        "Você não pode excluir esta movimentação.",
                });
            }

            const movimentacao = movimentacaoResult.rows[0];
            if (movimentacao.fatura_pagamento_id) {
                await client.query("ROLLBACK");
                return res.status(409).json({ mensagem: "O pagamento de uma fatura não pode ser excluído." });
            }
            if (movimentacao.meta_movimentacao_id) {
                await client.query("ROLLBACK");
                return res.status(409).json({ mensagem: "Transferências de metas devem ser gerenciadas em Planejamento." });
            }
            if (movimentacao.forma_pagamento === "credito" && movimentacao.cartao_id) {
                await client.query("SELECT id FROM cartoes WHERE id = $1 AND usuario_id = $2 FOR UPDATE", [movimentacao.cartao_id, req.usuarioId]);
                const faturaProtegida = await client.query(
                    `SELECT 1 FROM faturas_cartao WHERE cartao_id = $1
                     AND ano = EXTRACT(YEAR FROM $2::date) AND mes = EXTRACT(MONTH FROM $2::date)
                     AND status <> 'aberta'`,
                    [movimentacao.cartao_id, movimentacao.data]
                );
                if (faturaProtegida.rowCount) {
                    await client.query("ROLLBACK");
                    return res.status(409).json({ mensagem: "Movimentações de uma fatura fechada ou paga não podem ser excluídas." });
                }
            }

            // =================================================
            // REMOVER VÍNCULO COM A LISTA
            // =================================================

            await client.query(
                `UPDATE listas
                 SET movimentacao_id = NULL
                 WHERE movimentacao_id = $1`,
                [movimentacaoId]
            );

            // =================================================
            // EXCLUIR MOVIMENTAÇÃO
            // =================================================

            const result =
                await client.query(
                    `DELETE FROM movimentacoes
                     WHERE id = $1
                     RETURNING *`,
                    [movimentacaoId]
                );

            if (
                result.rowCount === 0
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res.status(404).json({
                    mensagem:
                        "Movimentação não encontrada.",
                });
            }

            await client.query("COMMIT");

            return res.json({
                mensagem:
                    "Movimentação excluída com sucesso.",
                movimentacao:
                    result.rows[0],
            });
        } catch (err) {
            await client.query(
                "ROLLBACK"
            );

            console.error(
                "Erro ao excluir movimentação:",
                err
            );

            return res.status(500).json({
                mensagem:
                    "Erro ao excluir movimentação.",
            });
        } finally {
            client.release();
        }
    }
);

// =====================================================
// ORÇAMENTOS POR CATEGORIA
// =====================================================

app.get("/orcamentos/:usuarioId", autenticar, async (req, res) => {
    const usuarioId = Number(req.params.usuarioId);
    const mes = Number(req.query.mes);
    const ano = Number(req.query.ano);

    if (usuarioId !== req.usuarioId) {
        return res.status(403).json({ mensagem: "Acesso negado." });
    }

    if (!Number.isInteger(mes) || mes < 1 || mes > 12 ||
        !Number.isInteger(ano) || ano < 2000 || ano > 2200) {
        return res.status(400).json({ mensagem: "Período inválido." });
    }

    try {
        const result = await pool.query(
            `SELECT id, categoria, valor, mes, ano
             FROM orcamentos
             WHERE usuario_id = $1 AND mes = $2 AND ano = $3
             ORDER BY categoria`,
            [usuarioId, mes, ano]
        );

        return res.json(result.rows);
    } catch (err) {
        console.error("Erro ao buscar orçamentos:", err);
        return res.status(500).json({ mensagem: "Erro ao buscar orçamentos." });
    }
});

app.put("/orcamentos", autenticar, async (req, res) => {
    const { categoria, valor, mes, ano } = req.body;

    if (typeof categoria !== "string" || !categoria.trim() || categoria.trim().length > 80 ||
        typeof valor !== "number" || !Number.isFinite(valor) || valor <= 0 || valor > VALOR_MONETARIO_MAXIMO ||
        !Number.isInteger(mes) || mes < 1 || mes > 12 ||
        !Number.isInteger(ano) || ano < 2000 || ano > 2200) {
        return res.status(400).json({ mensagem: "Dados do orçamento inválidos." });
    }

    try {
        const result = await pool.query(
            `INSERT INTO orcamentos (usuario_id, categoria, valor, mes, ano)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (usuario_id, categoria, mes, ano)
             DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW()
             RETURNING id, categoria, valor, mes, ano`,
            [req.usuarioId, categoria.trim(), valor, mes, ano]
        );

        return res.json(result.rows[0]);
    } catch (err) {
        console.error("Erro ao salvar orçamento:", err);
        return res.status(500).json({ mensagem: "Erro ao salvar orçamento." });
    }
});

app.delete("/orcamentos/:id", autenticar, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ mensagem: "ID do orçamento inválido." });
    }

    try {
        const result = await pool.query(
            `DELETE FROM orcamentos
             WHERE id = $1 AND usuario_id = $2
             RETURNING id`,
            [id, req.usuarioId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ mensagem: "Orçamento não encontrado." });
        }

        return res.json({ mensagem: "Orçamento removido." });
    } catch (err) {
        console.error("Erro ao remover orçamento:", err);
        return res.status(500).json({ mensagem: "Erro ao remover orçamento." });
    }
});

// =====================================================
// ALTERAR SENHA
// =====================================================

app.put(
    "/alterar-senha",
    autenticar,
    limitarTentativas({ limite: 6, janelaMs: 30 * 60 * 1000 }),
    async (req, res) => {
        const {
            senhaAtual,
            novaSenha,
        } = req.body;

        if (
            typeof senhaAtual !== "string" ||
            !senhaAtual || senhaAtual.length > 128 ||
            typeof novaSenha !== "string" ||
            !novaSenha
        ) {
            return res.status(400).json({
                mensagem:
                    "Informe a senha atual e a nova senha.",
            });
        }

        if (
            novaSenha.length < 10 || novaSenha.length > 128
        ) {
            return res.status(400).json({
                mensagem:
                "A nova senha deve ter entre 10 e 128 caracteres.",
            });
        }

        try {
            const result =
                await pool.query(
                    `SELECT senha
                     FROM usuarios
                     WHERE id = $1`,
                    [req.usuarioId]
                );

            if (
                result.rowCount === 0
            ) {
                return res.status(404).json({
                    mensagem:
                        "Usuário não encontrado.",
                });
            }

            const usuario =
                result.rows[0];

            const senhaAtualValida =
                typeof usuario.senha === "string" && usuario.senha.startsWith("$2")
                    ? await bcrypt.compare(
                        senhaAtual,
                        usuario.senha
                    )
                    : false;

            if (
                !senhaAtualValida
            ) {
                return res.status(400).json({
                    mensagem:
                        "Senha atual incorreta.",
                });
            }

            const novaSenhaHash =
                await bcrypt.hash(
                    novaSenha,
                    12
                );

            await pool.query(
                `UPDATE usuarios
                 SET senha = $1,
                     token_version = token_version + 1
                 WHERE id = $2`,
                [
                    novaSenhaHash,
                    req.usuarioId,
                ]
            );

            limparTentativas(req);

            return res.json({
                mensagem:
                    "Senha alterada com sucesso.",
            });
        } catch (err) {
            console.error(
                "Erro ao alterar senha:",
                err
            );

            return res.status(500).json({
                mensagem:
                    "Erro ao alterar senha.",
            });
        }
    }
);

// =====================================================
// ROTA DE TESTE
// =====================================================

app.use("/cartoes", cartoesRouter);
app.use("/categorias", categoriasRouter);
app.use("/recorrencias", recorrenciasRouter);
app.use("/metas", metasRouter);

app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        return res.json({ status: "ok", banco: "conectado", timestamp: new Date().toISOString() });
    } catch {
        return res.status(503).json({ status: "indisponivel", banco: "desconectado" });
    }
});

app.get("/", (req, res) => {
    return res.json({
        mensagem: "API funcionando.",
    });
});

// =====================================================
// TRATAMENTO DE ERRO
// =====================================================

app.use(rotaNaoEncontrada);
app.use(tratarErro);

// =====================================================
// START SERVER
// =====================================================

async function iniciarServidor() {
    const migracao = await fs.readFile(
        path.join(__dirname, "migrations/001_initial.sql"),
        "utf8"
    );
    await pool.query(migracao);

    app.listen(PORT, () => {
        console.log(`Backend rodando na porta ${PORT}`);
    });
}

if (require.main === module) {
    iniciarServidor().catch((err) => {
        console.error("Erro ao preparar o banco de dados:", err);
        process.exit(1);
    });
}

module.exports = app;
