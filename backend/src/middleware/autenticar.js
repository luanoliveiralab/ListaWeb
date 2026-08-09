const jwt = require("jsonwebtoken");
const { lerCookies } = require("../security");
const { pool } = require("../db");

async function autenticar(req, res, next) {
    const autorizacao = req.headers.authorization;
    const tokenCabecalho = autorizacao?.startsWith("Bearer ")
        ? autorizacao.slice(7)
        : null;
    const cookies = lerCookies(req);
    const token = cookies.listaweb_token || tokenCabecalho;

    if (!token) {
        return res.status(401).json({ mensagem: "Acesso não autorizado." });
    }

    try {
        const dados = jwt.verify(token, process.env.JWT_SECRET);
        req.usuarioId = Number(dados.id);

        if (!Number.isInteger(req.usuarioId) || req.usuarioId <= 0) {
            return res.status(401).json({ mensagem: "Token inválido." });
        }

        const usuario = await pool.query("SELECT token_version FROM usuarios WHERE id = $1", [req.usuarioId]);
        if (!usuario.rowCount || Number(dados.v) !== Number(usuario.rows[0].token_version)) {
            return res.status(401).json({ mensagem: "Sessão inválida ou expirada." });
        }

        return next();
    } catch {
        return res.status(401).json({
            mensagem: "Sessão inválida ou expirada.",
        });
    }
}

module.exports = { autenticar };
