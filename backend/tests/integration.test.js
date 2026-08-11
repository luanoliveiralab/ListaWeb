require("dotenv").config();
const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const app = require("../server");
const { pool } = require("../src/db");

let servidor;
let baseUrl;

test.before(async () => {
    servidor = app.listen(0);
    await new Promise((resolve) => servidor.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${servidor.address().port}`;
});

test.after(async () => {
    await new Promise((resolve) => servidor.close(resolve));
    await pool.end();
});

test("health confirma comunicação com o banco", async () => {
    const response = await fetch(`${baseUrl}/health`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    assert.equal((await response.json()).status, "ok");
});

test("emite token CSRF e bloqueia escrita sem ele", async () => {
    const csrfResponse = await fetch(`${baseUrl}/csrf`);
    const csrf = await csrfResponse.json();
    assert.equal(typeof csrf.csrfToken, "string");
    const bloqueada = await fetch(`${baseUrl}/financas`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    assert.equal(bloqueada.status, 403);
});

test("rota privada rejeita acesso sem sessão", async () => {
    const response = await fetch(`${baseUrl}/me`);
    assert.equal(response.status, 401);
    assert.equal((await response.json()).codigo, "SESSAO_INVALIDA");
});

test("categorias globais ficam isoladas por sessão", async () => {
    const response = await fetch(`${baseUrl}/categorias`);
    assert.equal(response.status, 401);
});

test("cartões e status bancário carregam com o novo ciclo de fatura", async (contexto) => {
    const usuario = await pool.query("SELECT id, token_version FROM usuarios ORDER BY id LIMIT 1");
    if (!usuario.rowCount) return contexto.skip("Banco de teste sem usuário cadastrado.");
    const token = jwt.sign({ id: usuario.rows[0].id, v: usuario.rows[0].token_version }, process.env.JWT_SECRET, { algorithm: "HS256", expiresIn: "5m" });
    const headers = { authorization: `Bearer ${token}` };
    const [cartoes, integracao] = await Promise.all([
        fetch(`${baseUrl}/cartoes`, { headers }),
        fetch(`${baseUrl}/integracoes/bancarias/status`, { headers }),
    ]);
    assert.equal(cartoes.status, 200);
    const dadosCartoes = await cartoes.json();
    assert.ok(Array.isArray(dadosCartoes));
    if (dadosCartoes.length) {
        const faturas = await fetch(`${baseUrl}/cartoes/${dadosCartoes[0].id}/faturas`, { headers });
        assert.equal(faturas.status, 200);
        assert.ok(Array.isArray(await faturas.json()));
    }
    assert.equal(integracao.status, 200);
    assert.deepEqual((await integracao.json()).importacoes_disponiveis, ["ofx", "csv"]);
});

test("login não revela se o e-mail existe", async () => {
    const response = await fetch(`${baseUrl}/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: `inexistente-${Date.now()}@teste.local`, senha: "senha-inexistente-segura" }) });
    assert.equal(response.status, 401);
    assert.match((await response.json()).mensagem, /e-mail ou senha/i);
});
