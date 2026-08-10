const test = require("node:test");
const assert = require("node:assert/strict");
const { criarAppCartoesHono } = require("../labs/hono/cartoes-app");

function montarLaboratorio(cartoesIniciais = []) {
    const cartoes = cartoesIniciais.map((cartao) => ({ ...cartao }));
    const repositorio = {
        async listar(usuarioId) { return cartoes.filter((cartao) => cartao.usuario_id === usuarioId); },
        async contar(usuarioId) { return cartoes.filter((cartao) => cartao.usuario_id === usuarioId).length; },
        async criar(usuarioId, dados) {
            const cartao = { id: cartoes.length + 1, usuario_id: usuarioId, ...dados };
            cartoes.push(cartao);
            return cartao;
        },
        async remover(usuarioId, id) {
            const indice = cartoes.findIndex((cartao) => cartao.usuario_id === usuarioId && cartao.id === id);
            if (indice < 0) return false;
            cartoes.splice(indice, 1);
            return true;
        },
    };
    return criarAppCartoesHono({ repositorio, autenticar: async (token) => token === "Bearer teste" ? 7 : null });
}

test("laboratório Hono protege as rotas de cartões", async () => {
    const resposta = await montarLaboratorio().request("/cartoes");
    assert.equal(resposta.status, 401);
    assert.deepEqual(await resposta.json(), { mensagem: "Acesso não autorizado." });
});

test("laboratório Hono lista e cria cartão sem servidor real", async () => {
    const app = montarLaboratorio([{ id: 1, usuario_id: 7, nome: "Principal" }]);
    const lista = await app.request("/cartoes", { headers: { authorization: "Bearer teste" } });
    assert.equal(lista.status, 200);
    assert.ok(lista.headers.get("x-request-id"));
    assert.equal((await lista.json()).length, 1);

    const criacao = await app.request("/cartoes", {
        method: "POST",
        headers: { authorization: "Bearer teste", "content-type": "application/json" },
        body: JSON.stringify({ nome: "Viagens", instituicao: "nubank", limite_disponivel: 2500, dia_vencimento: 12 }),
    });
    assert.equal(criacao.status, 201);
    assert.equal((await criacao.json()).nome, "Viagens");
});

test("laboratório Hono preserva validações de limite e propriedade", async () => {
    const quatro = Array.from({ length: 4 }, (_, indice) => ({ id: indice + 1, usuario_id: 7, nome: `Cartão ${indice + 1}` }));
    const app = montarLaboratorio(quatro);
    const limite = await app.request("/cartoes", {
        method: "POST",
        headers: { authorization: "Bearer teste", "content-type": "application/json" },
        body: JSON.stringify({ nome: "Extra", instituicao: "itau", limite_disponivel: 500, dia_vencimento: 5 }),
    });
    assert.equal(limite.status, 400);
    assert.match((await limite.json()).mensagem, /máximo 4/);

    const exclusao = await app.request("/cartoes/99", { method: "DELETE", headers: { authorization: "Bearer teste" } });
    assert.equal(exclusao.status, 404);
});
