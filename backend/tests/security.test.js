const test = require("node:test");
const assert = require("node:assert/strict");
const { cookieOptions, protegerCsrf, limitarTentativas, limparTodasTentativas } = require("../src/security");

test("cookie de autenticação não fica acessível ao JavaScript", () => {
    const options = cookieOptions();
    assert.equal(options.httpOnly, true);
    assert.equal(options.sameSite, "lax");
    assert.equal(options.path, "/");
});

test("limita tentativas repetidas no mesmo endereço", () => {
    limparTodasTentativas();
    const middleware = limitarTentativas({ limite: 2, janelaMs: 60_000 });
    const req = { ip: "127.0.0.1", path: "/login" };
    let chamadas = 0;
    const res = {
        statusCode: 200,
        setHeader() {},
        status(codigo) { this.statusCode = codigo; return this; },
        json(payload) { this.payload = payload; return this; },
    };
    middleware(req, res, () => chamadas++);
    middleware(req, res, () => chamadas++);
    middleware(req, res, () => chamadas++);
    assert.equal(chamadas, 2);
    assert.equal(res.statusCode, 429);
});

test("bloqueia alteração sem token CSRF correspondente", () => {
    const req = { method: "POST", path: "/financas", headers: { cookie: "listaweb_csrf=seguro" } };
    const res = {
        statusCode: 200,
        status(codigo) { this.statusCode = codigo; return this; },
        json(payload) { this.payload = payload; return this; },
    };
    protegerCsrf(req, res, () => assert.fail("Não deveria prosseguir"));
    assert.equal(res.statusCode, 403);
});

test("aceita alteração com token CSRF correspondente", () => {
    const req = { method: "PUT", path: "/metas/1", headers: { cookie: "listaweb_csrf=seguro", "x-csrf-token": "seguro" } };
    let prosseguiu = false;
    protegerCsrf(req, {}, () => { prosseguiu = true; });
    assert.equal(prosseguiu, true);
});
