const test = require("node:test");
const assert = require("node:assert/strict");
const { criarTemplate } = require("../src/email");

test("template de e-mail preserva identidade, alternativa textual e segurança", () => {
    const { texto, html } = criarTemplate({ nome: "Ana", titulo: "Confirme seu e-mail", introducao: "Ative sua conta.", acao: "Confirmar", link: "https://listaweb.netlify.app/verificar-email?token=seguro", validade: "Expira em 24 horas.", seguranca: "Ignore se não reconhece." });
    assert.match(html, /ListaWeb/);
    assert.match(html, /max-width:600px/);
    assert.match(html, /copie este endereço/i);
    assert.match(texto, /https:\/\/listaweb\.netlify\.app/);
    assert.match(texto, /Ignore se não reconhece/);
});

test("template escapa dados recebidos antes de montar o HTML", () => {
    const { html } = criarTemplate({ nome: "<script>alert(1)</script>", titulo: "Teste", introducao: "Mensagem", acao: "Abrir", link: "https://exemplo.test/?a=1&b=2", validade: "Agora", seguranca: "Seguro" });
    assert.doesNotMatch(html, /<script>alert/);
    assert.match(html, /&lt;script&gt;/);
    assert.match(html, /a=1&amp;b=2/);
});
