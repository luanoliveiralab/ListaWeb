const test = require("node:test");
const assert = require("node:assert/strict");
const { validarCategoria, categoriasPadrao } = require("../src/routes/categorias");

test("novos usuários começam com três categorias de despesa e três de receita", () => {
    assert.equal(categoriasPadrao.despesa.length, 3);
    assert.equal(categoriasPadrao.receita.length, 3);
});

test("categoria aceita uma ou mais páginas e mantém compatibilidade", () => {
    assert.deepEqual(validarCategoria({ nome: "  Pets  ", tipo: "despesa", aplica_lista: true, aplica_financas: false, aplica_planejamento: false }), { nome: "Pets", tipo: "despesa", aplica_lista: true, aplica_financas: false, aplica_planejamento: false });
    assert.deepEqual(validarCategoria({ nome: "Salário", tipo: "receita" }), { nome: "Salário", tipo: "receita", aplica_lista: true, aplica_financas: true, aplica_planejamento: true });
});

test("categoria exige ao menos uma página", () => {
    assert.throws(() => validarCategoria({ nome: "Oculta", tipo: "despesa", aplica_lista: false, aplica_financas: false, aplica_planejamento: false }), /ao menos uma página/i);
});

test("categoria rejeita flags de página que não sejam booleanas", () => {
    assert.throws(
        () => validarCategoria({ nome: "Pets", tipo: "despesa", aplica_lista: "false" }),
        /verdadeiro ou falso/
    );
});
