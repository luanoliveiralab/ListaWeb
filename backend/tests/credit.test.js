const test = require("node:test");
const assert = require("node:assert/strict");
const { buscarCartaoComUso, possuiLimite } = require("../src/credit");

test("considera apenas o crédito ainda comprometido no limite do cartão", async () => {
    let consulta;
    const executor = {
        async query(sql, parametros) {
            consulta = { sql, parametros };
            return { rows: [{ id: 7, limite_disponivel: "2000.00", limite_utilizado: "450.00" }] };
        },
    };

    const cartao = await buscarCartaoComUso(executor, 42, 7, {
        bloquear: true,
        ignorarMovimentacaoId: 15,
    });

    assert.equal(cartao.id, 7);
    assert.deepEqual(consulta.parametros, [7, 42, 15]);
    assert.match(consulta.sql, /f\.status = 'paga'/);
    assert.match(consulta.sql, /m\.id <> \$3/);
    assert.match(consulta.sql, /FOR UPDATE OF c/);
});

test("impede uma despesa que ultrapasse o crédito disponível", () => {
    const cartao = { limite_disponivel: "1000.00", limite_utilizado: "750.00" };
    assert.equal(possuiLimite(cartao, 250), true);
    assert.equal(possuiLimite(cartao, 250.01), false);
    assert.equal(possuiLimite(cartao, Number.NaN), false);
    assert.equal(possuiLimite(null, 10), false);
});
