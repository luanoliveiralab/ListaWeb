const { Hono } = require("hono");
const { requestId } = require("hono/request-id");

function numeroPositivo(valor) {
    const numero = Number(valor);
    return Number.isInteger(numero) && numero > 0 ? numero : null;
}

function validarCartao(body) {
    const limite = Number(body?.limite_disponivel);
    const vencimento = Number(body?.dia_vencimento);
    if (
        typeof body?.nome !== "string" || !body.nome.trim() || body.nome.trim().length > 80 ||
        typeof body?.instituicao !== "string" || !body.instituicao.trim() || body.instituicao.trim().length > 80 ||
        !Number.isFinite(limite) || limite < 0 ||
        !Number.isInteger(vencimento) || vencimento < 1 || vencimento > 31
    ) return null;
    return { nome: body.nome.trim(), instituicao: body.instituicao.trim(), limite_disponivel: limite, dia_vencimento: vencimento };
}

function criarAppCartoesHono({ repositorio, autenticar }) {
    const app = new Hono();
    app.use("*", requestId());
    app.use("*", async (contexto, next) => {
        const usuarioId = await autenticar(contexto.req.header("authorization"));
        if (!usuarioId) return contexto.json({ mensagem: "Acesso não autorizado." }, 401);
        contexto.set("usuarioId", usuarioId);
        await next();
    });

    app.get("/cartoes", async (contexto) => {
        const cartoes = await repositorio.listar(contexto.get("usuarioId"));
        contexto.header("X-Request-Id", contexto.get("requestId"));
        return contexto.json(cartoes);
    });

    app.post("/cartoes", async (contexto) => {
        const dados = validarCartao(await contexto.req.json().catch(() => null));
        if (!dados) return contexto.json({ mensagem: "Dados do cartão inválidos." }, 400);
        const usuarioId = contexto.get("usuarioId");
        if (await repositorio.contar(usuarioId) >= 4) {
            return contexto.json({ mensagem: "Você pode cadastrar no máximo 4 cartões." }, 400);
        }
        return contexto.json(await repositorio.criar(usuarioId, dados), 201);
    });

    app.delete("/cartoes/:id", async (contexto) => {
        const id = numeroPositivo(contexto.req.param("id"));
        if (!id) return contexto.json({ mensagem: "ID do cartão inválido." }, 400);
        const removido = await repositorio.remover(contexto.get("usuarioId"), id);
        if (!removido) return contexto.json({ mensagem: "Cartão não encontrado." }, 404);
        return contexto.json({ mensagem: "Cartão removido." });
    });

    app.notFound((contexto) => contexto.json({ mensagem: "Rota não encontrada." }, 404));
    app.onError((erro, contexto) => {
        console.error(`[laboratorio-hono:${contexto.get("requestId")}]`, erro);
        return contexto.json({ mensagem: "Erro interno do servidor." }, 500);
    });
    return app;
}

module.exports = { criarAppCartoesHono, validarCartao };
