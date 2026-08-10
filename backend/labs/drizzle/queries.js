const { and, desc, eq } = require("drizzle-orm");
const { cartoes, faturasCartao } = require("./schema");

function consultaCartoes(db, usuarioId) {
    return db.select({
        id: cartoes.id,
        nome: cartoes.nome,
        instituicao: cartoes.instituicao,
        limite_disponivel: cartoes.limiteDisponivel,
        dia_vencimento: cartoes.diaVencimento,
        created_at: cartoes.criadoEm,
    }).from(cartoes)
        .where(eq(cartoes.usuarioId, usuarioId))
        .orderBy(desc(cartoes.criadoEm), desc(cartoes.id));
}

function consultaFatura(db, { usuarioId, cartaoId, ano, mes }) {
    return db.select({
        id: faturasCartao.id,
        status: faturasCartao.status,
        fechada_em: faturasCartao.fechadaEm,
        paga_em: faturasCartao.pagaEm,
    }).from(faturasCartao).where(and(
        eq(faturasCartao.usuarioId, usuarioId),
        eq(faturasCartao.cartaoId, cartaoId),
        eq(faturasCartao.ano, ano),
        eq(faturasCartao.mes, mes)
    ));
}

module.exports = { consultaCartoes, consultaFatura };
