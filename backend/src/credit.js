async function buscarCartaoComUso(executor, usuarioId, cartaoId, { bloquear = false, ignorarMovimentacaoId = null } = {}) {
    const result = await executor.query(
        `SELECT c.*,
                COALESCE((
                    SELECT SUM(m.valor)
                    FROM movimentacoes m
                    WHERE m.usuario_id = c.usuario_id
                      AND m.cartao_id = c.id
                      AND m.tipo = 'despesa'
                      AND m.forma_pagamento = 'credito'
                      AND ($3::integer IS NULL OR m.id <> $3)
                      AND NOT EXISTS (
                          SELECT 1
                          FROM faturas_cartao f
                          WHERE f.cartao_id = m.cartao_id
                            AND f.usuario_id = m.usuario_id
                            AND f.ano = COALESCE(m.fatura_ano, EXTRACT(YEAR FROM m.data)::integer)
                            AND f.mes = COALESCE(m.fatura_mes, EXTRACT(MONTH FROM m.data)::integer)
                            AND f.status = 'paga'
                      )
                ), 0)::numeric(12,2) AS limite_utilizado
         FROM cartoes c
         WHERE c.id = $1 AND c.usuario_id = $2
         ${bloquear ? "FOR UPDATE OF c" : ""}`,
        [cartaoId, usuarioId, ignorarMovimentacaoId]
    );
    return result.rows[0] ?? null;
}

function possuiLimite(cartao, valor) {
    if (!cartao) return false;
    const disponivel = Number(cartao.limite_disponivel) - Number(cartao.limite_utilizado);
    return Number.isFinite(valor) && valor <= disponivel + 0.00001;
}

module.exports = { buscarCartaoComUso, possuiLimite };
