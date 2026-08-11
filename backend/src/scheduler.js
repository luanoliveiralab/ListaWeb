const { pool } = require("./db");
const { buscarCartaoComUso, possuiLimite } = require("./credit");

const DATA_LOCAL_SQL = "(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date";

async function tentarCredito(client, item) {
    if (item.tipo !== "despesa" || item.forma_pagamento !== "credito") return null;
    const cartao = await buscarCartaoComUso(client, item.usuario_id, item.cartao_id, { bloquear: true });
    if (!cartao) return "Cartão indisponível para este lançamento.";
    if (!possuiLimite(cartao, Number(item.valor))) return "Limite de crédito insuficiente.";
    return null;
}

async function inserirMovimentacao(client, item, recorrenciaId = null) {
    return client.query(
        `INSERT INTO movimentacoes
            (usuario_id, tipo, descricao, valor, categoria, data, recorrencia_id, forma_pagamento, cartao_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (recorrencia_id, data) WHERE recorrencia_id IS NOT NULL DO NOTHING
         RETURNING id`,
        [item.usuario_id, item.tipo, item.descricao, item.valor, item.categoria, item.data_programada, recorrenciaId, item.forma_pagamento, item.cartao_id]
    );
}

async function processarAgendamentosDoDia({ usuarioId = null } = {}) {
    const client = await pool.connect();
    const resultado = { geradas: 0, falhas: 0 };
    try {
        await client.query("BEGIN");
        const trava = await client.query("SELECT pg_try_advisory_xact_lock($1) AS obtida", [usuarioId ? 910000 + usuarioId : 909999]);
        if (!trava.rows[0].obtida) { await client.query("ROLLBACK"); return resultado; }

        const filtroUsuario = usuarioId ? "AND usuario_id = $1" : "";
        const parametros = usuarioId ? [usuarioId] : [];
        const avulsas = await client.query(
            `SELECT * FROM movimentacoes_programadas
             WHERE lancada_em IS NULL AND data_programada = ${DATA_LOCAL_SQL} ${filtroUsuario}
             ORDER BY id FOR UPDATE`, parametros
        );
        for (const item of avulsas.rows) {
            const erro = await tentarCredito(client, item);
            if (erro) {
                await client.query("UPDATE movimentacoes_programadas SET status = 'falha', erro = $1, ultima_tentativa_em = NOW() WHERE id = $2", [erro, item.id]);
                resultado.falhas += 1;
                continue;
            }
            const inserida = await inserirMovimentacao(client, item);
            await client.query("UPDATE movimentacoes_programadas SET status = 'realizada', erro = NULL, movimentacao_id = $1, lancada_em = NOW(), ultima_tentativa_em = NOW() WHERE id = $2", [inserida.rows[0].id, item.id]);
            resultado.geradas += 1;
        }

        const recorrencias = await client.query(
            `SELECT r.*, ${DATA_LOCAL_SQL} AS data_programada
             FROM recorrencias r
             WHERE r.ativa = TRUE AND r.dia = EXTRACT(DAY FROM ${DATA_LOCAL_SQL})
               AND r.inicio <= ${DATA_LOCAL_SQL} AND (r.fim IS NULL OR r.fim >= ${DATA_LOCAL_SQL})
               ${usuarioId ? "AND r.usuario_id = $1" : ""}
             ORDER BY r.id FOR UPDATE`, parametros
        );
        for (const recorrencia of recorrencias.rows) {
            const execucao = await client.query(
                `INSERT INTO recorrencia_execucoes (recorrencia_id, usuario_id, data_programada)
                 VALUES ($1,$2,$3) ON CONFLICT (recorrencia_id, data_programada) DO UPDATE SET recorrencia_id = EXCLUDED.recorrencia_id
                 RETURNING *`,
                [recorrencia.id, recorrencia.usuario_id, recorrencia.data_programada]
            );
            if (execucao.rows[0].status === "realizada") continue;
            const erro = await tentarCredito(client, recorrencia);
            if (erro) {
                await client.query("UPDATE recorrencia_execucoes SET status = 'falha', erro = $1, ultima_tentativa_em = NOW() WHERE id = $2", [erro, execucao.rows[0].id]);
                resultado.falhas += 1;
                continue;
            }
            const inserida = await inserirMovimentacao(client, recorrencia, recorrencia.id);
            const movimentacaoId = inserida.rows[0]?.id ?? (await client.query("SELECT id FROM movimentacoes WHERE recorrencia_id = $1 AND data = $2", [recorrencia.id, recorrencia.data_programada])).rows[0].id;
            await client.query("UPDATE recorrencia_execucoes SET status = 'realizada', erro = NULL, movimentacao_id = $1, ultima_tentativa_em = NOW() WHERE id = $2", [movimentacaoId, execucao.rows[0].id]);
            resultado.geradas += inserida.rowCount;
        }
        await client.query(
            `INSERT INTO faturas_cartao (cartao_id, usuario_id, ano, mes, status, fechada_em)
             SELECT DISTINCT c.id, c.usuario_id, periodos.ano, periodos.mes, 'fechada', NOW()
             FROM cartoes c
             JOIN (
                 SELECT cartao_id,
                        COALESCE(fatura_ano, EXTRACT(YEAR FROM data)::integer) AS ano,
                        COALESCE(fatura_mes, EXTRACT(MONTH FROM data)::integer) AS mes
                 FROM movimentacoes
                 WHERE forma_pagamento = 'credito' AND cartao_id IS NOT NULL
             ) periodos ON periodos.cartao_id = c.id
             WHERE make_date(
                       periodos.ano,
                       periodos.mes,
                       LEAST(c.dia_fechamento, EXTRACT(DAY FROM (make_date(periodos.ano, periodos.mes, 1) + INTERVAL '1 month - 1 day'))::integer)
                   ) <= ${DATA_LOCAL_SQL}
               ${usuarioId ? "AND c.usuario_id = $1" : ""}
             ON CONFLICT (cartao_id, ano, mes) DO UPDATE
             SET status = 'fechada', fechada_em = NOW(), updated_at = NOW()
             WHERE faturas_cartao.status = 'aberta'`, parametros
        );
        await client.query("COMMIT");
        return resultado;
    } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
    } finally { client.release(); }
}

function iniciarMotorDeAgendamentos() {
    const executar = () => processarAgendamentosDoDia().catch((error) => console.error("Erro no motor de agendamentos:", error));
    executar();
    const intervalo = setInterval(executar, 5 * 60 * 1000);
    intervalo.unref?.();
}

module.exports = { processarAgendamentosDoDia, iniciarMotorDeAgendamentos, DATA_LOCAL_SQL };
