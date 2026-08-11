const test = require("node:test");
const assert = require("node:assert/strict");
const { interpretarArquivoFinanceiro } = require("../src/financial-import");

test("interpreta extrato CSV brasileiro e mantém receitas e despesas", () => {
    const registros = interpretarArquivoFinanceiro("csv", [
        "data;descrição;valor",
        "10/08/2026;Salário;2500,00",
        "10/08/2026;Mercado;-123,45",
    ].join("\n"));
    assert.equal(registros.length, 2);
    assert.deepEqual(registros.map(({ tipo, valor, data }) => ({ tipo, valor, data })), [
        { tipo: "receita", valor: 2500, data: "2026-08-10" },
        { tipo: "despesa", valor: 123.45, data: "2026-08-10" },
    ]);
});

test("interpreta OFX e usa FITID para deduplicação estável", () => {
    const conteudo = `<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKTRANLIST>
      <STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260810120000<TRNAMT>-42.90<FITID>abc-123<NAME>Farmácia</STMTTRN>
    </BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>`;
    const primeira = interpretarArquivoFinanceiro("ofx", conteudo);
    const segunda = interpretarArquivoFinanceiro("ofx", conteudo);
    assert.equal(primeira[0].tipo, "despesa");
    assert.equal(primeira[0].data, "2026-08-10");
    assert.equal(primeira[0].referencia_externa, segunda[0].referencia_externa);
});

test("recusa arquivos financeiros acima do limite", () => {
    assert.throws(() => interpretarArquivoFinanceiro("csv", "x".repeat(1024 * 1024 + 1)), /1 MB/);
});
