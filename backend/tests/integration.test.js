require("dotenv").config();
const test = require("node:test");
const assert = require("node:assert/strict");
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
});

test("login não revela se o e-mail existe", async () => {
    const response = await fetch(`${baseUrl}/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: `inexistente-${Date.now()}@teste.local`, senha: "senha-inexistente-segura" }) });
    assert.equal(response.status, 401);
    assert.match((await response.json()).mensagem, /e-mail ou senha/i);
});
