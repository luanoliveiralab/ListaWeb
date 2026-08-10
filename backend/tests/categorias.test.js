const test = require("node:test");
const assert = require("node:assert/strict");
const { validarCategoria } = require("../src/routes/categorias");

test("categoria aceita uma ou mais páginas e mantém compatibilidade", () => {
    assert.deepEqual(validarCategoria({ nome: "  Pets  ", tipo: "despesa", aplica_lista: true, aplica_financas: false, aplica_planejamento: false }), { nome: "Pets", tipo: "despesa", aplica_lista: true, aplica_financas: false, aplica_planejamento: false });
    assert.deepEqual(validarCategoria({ nome: "Salário", tipo: "receita" }), { nome: "Salário", tipo: "receita", aplica_lista: true, aplica_financas: true, aplica_planejamento: true });
});

test("categoria exige ao menos uma página", () => {
    assert.throws(() => validarCategoria({ nome: "Oculta", tipo: "despesa", aplica_lista: false, aplica_financas: false, aplica_planejamento: false }), /ao menos uma página/i);
});
