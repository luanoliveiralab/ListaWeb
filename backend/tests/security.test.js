const test = require("node:test");
const assert = require("node:assert/strict");
const { cookieOptions, protegerCsrf, limitarTentativas, limparTodasTentativas } = require("../src/security");
const { HttpError, criarContextoRequisicao, idPositivo, periodoValido, tratarErro } = require("../src/http");

test("valida identificadores e períodos da API", () => {
    assert.equal(idPositivo("12"), 12);
    assert.deepEqual(periodoValido("8", "2026"), { mes: 8, ano: 2026 });
    assert.throws(() => idPositivo("0"), (erro) => erro instanceof HttpError && erro.codigo === "ID_INVALIDO");
    assert.throws(() => periodoValido("13", "2026"), (erro) => erro instanceof HttpError && erro.codigo === "PERIODO_INVALIDO");
});

test("atribui um identificador seguro a cada requisição", () => {
    const headers = {};
    const req = { headers: { "x-request-id": "fluxo-seguro_123" } };
    criarContextoRequisicao(req, { setHeader(nome, valor) { headers[nome] = valor; } }, () => {});
    assert.equal(req.requestId, "fluxo-seguro_123");
    assert.equal(headers["X-Request-Id"], "fluxo-seguro_123");

    const reqInvalida = { headers: { "x-request-id": "quebra\nlinha" } };
    criarContextoRequisicao(reqInvalida, { setHeader() {} }, () => {});
    assert.match(reqInvalida.requestId, /^[0-9a-f-]{36}$/);
});

test("retorna erros operacionais com código e identificador", () => {
    const res = {
        status(codigo) { this.statusCode = codigo; return this; },
        json(payload) { this.payload = payload; return this; },
    };
    tratarErro(new HttpError(404, "Não encontrado.", "NAO_ENCONTRADO"), { requestId: "req-1" }, res);
    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.payload, { mensagem: "Não encontrado.", codigo: "NAO_ENCONTRADO", requestId: "req-1" });
});

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
    assert.equal(res.payload.codigo, "CSRF_INVALIDO");
});

test("aceita alteração com token CSRF correspondente", () => {
    const req = { method: "PUT", path: "/metas/1", headers: { cookie: "listaweb_csrf=seguro", "x-csrf-token": "seguro" } };
    let prosseguiu = false;
    protegerCsrf(req, {}, () => { prosseguiu = true; });
    assert.equal(prosseguiu, true);
});

test("permite confirmar e-mail sem uma sessão prévia", () => {
    const req = { method: "POST", path: "/verificar-email", headers: {} };
    let prosseguiu = false;
    protegerCsrf(req, {}, () => { prosseguiu = true; });
    assert.equal(prosseguiu, true);
});
