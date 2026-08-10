const test = require("node:test");
const assert = require("node:assert/strict");
const { drizzle } = require("drizzle-orm/node-postgres");
const schema = require("../labs/drizzle/schema");
const { consultaCartoes, consultaFatura } = require("../labs/drizzle/queries");

const db = drizzle.mock({ schema });

test("Drizzle gera listagem explícita e restrita ao usuário", () => {
    const consulta = consultaCartoes(db, 42).toSQL();
    assert.match(consulta.sql, /select "id", "nome", "instituicao", "limite_disponivel", "dia_vencimento", "created_at" from "cartoes"/);
    assert.match(consulta.sql, /where "cartoes"\."usuario_id" = \$1/);
    assert.deepEqual(consulta.params, [42]);
    assert.doesNotMatch(consulta.sql, /select \*/i);
});

test("Drizzle parametriza todos os identificadores da fatura", () => {
    const consulta = consultaFatura(db, { usuarioId: 7, cartaoId: 3, ano: 2026, mes: 8 }).toSQL();
    assert.deepEqual(consulta.params, [7, 3, 2026, 8]);
    assert.match(consulta.sql, /"usuario_id" = \$1/);
    assert.match(consulta.sql, /"cartao_id" = \$2/);
    assert.match(consulta.sql, /"ano" = \$3/);
    assert.match(consulta.sql, /"mes" = \$4/);
});

test("esquema Drizzle preserva nomes e restrição única existentes", () => {
    const consulta = consultaFatura(db, { usuarioId: 1, cartaoId: 2, ano: 2026, mes: 1 }).toSQL();
    assert.match(consulta.sql, /from "faturas_cartao"/);
    assert.equal(schema.cartoes.limiteDisponivel.name, "limite_disponivel");
    assert.equal(schema.faturasCartao.fechadaEm.name, "fechada_em");
});
