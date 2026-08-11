const test = require("node:test");
const assert = require("node:assert/strict");
const { frontendUrlPrincipal, validarFotoDataUrl, booleanoOpcional } = require("../src/validation");

test("usa apenas a origem principal nos links enviados por e-mail", () => {
    const anterior = process.env.FRONTEND_URL;
    process.env.FRONTEND_URL = "https://listaweb.app, https://preview.listaweb.app";
    assert.equal(frontendUrlPrincipal(), "https://listaweb.app");
    if (anterior === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = anterior;
});

test("aceita somente imagens data URL válidas e dentro do limite", () => {
    const gif = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
    assert.equal(validarFotoDataUrl(gif), gif);
    assert.throws(() => validarFotoDataUrl("<svg onload=alert(1)>"), /JPG, PNG, WebP ou GIF/);
    assert.throws(() => validarFotoDataUrl("data:image/svg+xml;base64,PHN2Zz4="), /JPG, PNG, WebP ou GIF/);
    assert.throws(() => validarFotoDataUrl(`data:image/png;base64,${Buffer.alloc(2 * 1024 * 1024 + 1).toString("base64")}`), /2 MB/);
});

test("não converte textos em booleanos silenciosamente", () => {
    assert.equal(booleanoOpcional({}, "ativo"), true);
    assert.equal(booleanoOpcional({ ativo: false }, "ativo"), false);
    assert.throws(() => booleanoOpcional({ ativo: "false" }, "ativo"), /verdadeiro ou falso/);
});
