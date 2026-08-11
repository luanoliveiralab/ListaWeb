const express = require("express");
const { pool } = require("../db");
const { autenticar } = require("../middleware/autenticar");
const { asyncHandler, idPositivo, periodoValido } = require("../http");
const { buscarCartaoComUso } = require("../credit");

const router = express.Router();
router.use(autenticar);

function parametrosFatura(req) {
    return {
        id: idPositivo(req.params.id, "ID do cartão"),
        ...periodoValido(req.params.mes, req.params.ano),
    };
}

router.get("/", asyncHandler(async (req, res) => {
    const result = await pool.query(
        `SELECT c.*,
                COALESCE((
                    SELECT SUM(m.valor)
                    FROM movimentacoes m
                    WHERE m.usuario_id = c.usuario_id AND m.cartao_id = c.id
                      AND m.tipo = 'despesa' AND m.forma_pagamento = 'credito'
                      AND NOT EXISTS (
                          SELECT 1 FROM faturas_cartao f
                          WHERE f.cartao_id = m.cartao_id AND f.usuario_id = m.usuario_id
                            AND f.ano = COALESCE(m.fatura_ano, EXTRACT(YEAR FROM m.data)::integer)
                            AND f.mes = COALESCE(m.fatura_mes, EXTRACT(MONTH FROM m.data)::integer)
                            AND f.status = 'paga'
                      )
                ), 0)::numeric(12,2) AS limite_utilizado,
                COALESCE((
                    SELECT SUM(m.valor)
                    FROM movimentacoes m
                    WHERE m.usuario_id = c.usuario_id AND m.cartao_id = c.id
                      AND m.tipo = 'despesa' AND m.forma_pagamento = 'credito'
                      AND COALESCE(m.fatura_ano, EXTRACT(YEAR FROM m.data)::integer) = EXTRACT(YEAR FROM (
                          date_trunc('month', (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date)
                          + CASE WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo'))::integer > c.dia_fechamento THEN INTERVAL '1 month' ELSE INTERVAL '0 month' END
                      ))::integer
                      AND COALESCE(m.fatura_mes, EXTRACT(MONTH FROM m.data)::integer) = EXTRACT(MONTH FROM (
                          date_trunc('month', (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date)
                          + CASE WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo'))::integer > c.dia_fechamento THEN INTERVAL '1 month' ELSE INTERVAL '0 month' END
                      ))::integer
                ), 0)::numeric(12,2) AS fatura_atual
         FROM cartoes c WHERE c.usuario_id = $1 ORDER BY c.created_at DESC, c.id DESC`,
        [req.usuarioId]
    );
    return res.json(result.rows);
}));

router.post("/", asyncHandler(async (req, res) => {
    const { nome, instituicao, limite_disponivel, dia_vencimento, dia_fechamento } = req.body;
    const limite = Number(limite_disponivel);
    const vencimento = Number(dia_vencimento);
    const fechamento = dia_fechamento == null || dia_fechamento === "" ? Math.max(1, vencimento - 7) : Number(dia_fechamento);
    if (
        typeof nome !== "string" || !nome.trim() || nome.trim().length > 80 ||
        typeof instituicao !== "string" || !instituicao.trim() || instituicao.trim().length > 80 ||
        !Number.isFinite(limite) || limite < 0 || limite > 9_999_999_999.99 ||
        !Number.isInteger(vencimento) || vencimento < 1 || vencimento > 31 ||
        !Number.isInteger(fechamento) || fechamento < 1 || fechamento > 31
    ) return res.status(400).json({ mensagem: "Dados do cartão inválidos." });

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query("SELECT pg_advisory_xact_lock($1)", [req.usuarioId]);
        const quantidade = await client.query("SELECT COUNT(*)::int AS total FROM cartoes WHERE usuario_id = $1", [req.usuarioId]);
        if (quantidade.rows[0].total >= 4) {
            await client.query("ROLLBACK");
            return res.status(400).json({ mensagem: "Você pode cadastrar no máximo 4 cartões." });
        }
        const result = await client.query(
            `INSERT INTO cartoes (usuario_id, nome, instituicao, limite_disponivel, dia_vencimento, dia_fechamento)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [req.usuarioId, nome.trim(), instituicao.trim(), limite, vencimento, fechamento]
        );
        await client.query("COMMIT");
        return res.status(201).json(result.rows[0]);
    } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
    } finally { client.release(); }
}));

router.put("/:id", asyncHandler(async (req, res) => {
    const id = idPositivo(req.params.id, "ID do cartão");
    const { nome, instituicao, limite_disponivel, dia_vencimento, dia_fechamento } = req.body;
    const limite = Number(limite_disponivel);
    const vencimento = Number(dia_vencimento);
    const fechamento = Number(dia_fechamento);
    if (
        typeof nome !== "string" || !nome.trim() || nome.trim().length > 80 ||
        typeof instituicao !== "string" || !instituicao.trim() || instituicao.trim().length > 80 ||
        !Number.isFinite(limite) || limite < 0 || limite > 9_999_999_999.99 ||
        !Number.isInteger(vencimento) || vencimento < 1 || vencimento > 31 ||
        !Number.isInteger(fechamento) || fechamento < 1 || fechamento > 31
    ) return res.status(400).json({ mensagem: "Dados do cartão inválidos." });

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const cartao = await buscarCartaoComUso(client, req.usuarioId, id, { bloquear: true });
        if (!cartao) { await client.query("ROLLBACK"); return res.status(404).json({ mensagem: "Cartão não encontrado." }); }
        if (limite + 0.00001 < Number(cartao.limite_utilizado)) {
            await client.query("ROLLBACK");
            return res.status(409).json({ mensagem: "O limite não pode ser menor que o valor já utilizado." });
        }
        const result = await client.query(
            `UPDATE cartoes SET nome = $1, instituicao = $2, limite_disponivel = $3,
                dia_vencimento = $4, dia_fechamento = $5
             WHERE id = $6 AND usuario_id = $7 RETURNING *`,
            [nome.trim(), instituicao.trim(), limite, vencimento, fechamento, id, req.usuarioId]
        );
        await client.query("COMMIT");
        return res.json({ ...result.rows[0], limite_utilizado: cartao.limite_utilizado });
    } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
    } finally { client.release(); }
}));

router.get("/:id/faturas", asyncHandler(async (req, res) => {
    const id = idPositivo(req.params.id, "ID do cartão");
    const cartao = await pool.query("SELECT id, dia_vencimento, dia_fechamento FROM cartoes WHERE id = $1 AND usuario_id = $2", [id, req.usuarioId]);
    if (!cartao.rowCount) return res.status(404).json({ mensagem: "Cartão não encontrado." });
    const result = await pool.query(
        `WITH periodos AS (
            SELECT DISTINCT COALESCE(fatura_ano, EXTRACT(YEAR FROM data)::int) AS ano, COALESCE(fatura_mes, EXTRACT(MONTH FROM data)::int) AS mes
            FROM movimentacoes
            WHERE usuario_id = $1 AND cartao_id = $2 AND tipo = 'despesa' AND forma_pagamento = 'credito'
            UNION SELECT EXTRACT(YEAR FROM periodo_atual)::int, EXTRACT(MONTH FROM periodo_atual)::int
            FROM (
                SELECT date_trunc('month', (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date)
                    + CASE WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo'))::integer > $4 THEN INTERVAL '1 month' ELSE INTERVAL '0 month' END AS periodo_atual
            ) atual
         )
         SELECT p.ano, p.mes, COALESCE(f.status, 'aberta') AS status,
                COALESCE(SUM(m.valor), 0)::numeric(12,2) AS total, COUNT(m.id)::int AS quantidade,
                f.fechada_em, f.paga_em,
                make_date(p.ano, p.mes, 1) + INTERVAL '1 month'
                  + (LEAST(
                        $3,
                        EXTRACT(DAY FROM (make_date(p.ano, p.mes, 1) + INTERVAL '2 months - 1 day'))::integer
                    ) - 1) * INTERVAL '1 day' AS vencimento
         FROM periodos p
         LEFT JOIN faturas_cartao f ON f.cartao_id = $2 AND f.ano = p.ano AND f.mes = p.mes
         LEFT JOIN movimentacoes m ON m.usuario_id = $1 AND m.cartao_id = $2
            AND m.tipo = 'despesa' AND m.forma_pagamento = 'credito'
            AND COALESCE(m.fatura_ano, EXTRACT(YEAR FROM m.data)::int) = p.ano AND COALESCE(m.fatura_mes, EXTRACT(MONTH FROM m.data)::int) = p.mes
         GROUP BY p.ano, p.mes, f.status, f.fechada_em, f.paga_em
         ORDER BY p.ano DESC, p.mes DESC LIMIT 24`,
        [req.usuarioId, id, cartao.rows[0].dia_vencimento, cartao.rows[0].dia_fechamento]
    );
    return res.json(result.rows);
}));

router.get("/:id/faturas/:ano/:mes", asyncHandler(async (req, res) => {
    const { id, ano, mes } = parametrosFatura(req);
    const cartao = await pool.query("SELECT id FROM cartoes WHERE id = $1 AND usuario_id = $2", [id, req.usuarioId]);
    if (!cartao.rowCount) return res.status(404).json({ mensagem: "Cartão não encontrado." });
    const result = await pool.query(
        `SELECT m.id, m.descricao, m.valor, m.categoria, m.data, m.created_at
         FROM movimentacoes m
         WHERE m.usuario_id = $1 AND m.cartao_id = $2 AND m.tipo = 'despesa'
           AND m.forma_pagamento = 'credito'
           AND COALESCE(m.fatura_ano, EXTRACT(YEAR FROM m.data)::int) = $3 AND COALESCE(m.fatura_mes, EXTRACT(MONTH FROM m.data)::int) = $4
         ORDER BY m.data DESC, m.id DESC`,
        [req.usuarioId, id, ano, mes]
    );
    return res.json(result.rows);
}));

router.post("/:id/faturas/:ano/:mes/fechar", asyncHandler(async (req, res) => {
    const { id, ano, mes } = parametrosFatura(req);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const cartao = await client.query("SELECT id FROM cartoes WHERE id = $1 AND usuario_id = $2 FOR UPDATE", [id, req.usuarioId]);
        if (!cartao.rowCount) { await client.query("ROLLBACK"); return res.status(404).json({ mensagem: "Cartão não encontrado." }); }
        const total = await client.query(
            `SELECT COALESCE(SUM(valor), 0)::numeric(12,2) AS total, COUNT(*)::int AS quantidade
             FROM movimentacoes WHERE usuario_id = $1 AND cartao_id = $2 AND tipo = 'despesa'
               AND forma_pagamento = 'credito' AND COALESCE(fatura_ano, EXTRACT(YEAR FROM data)::int) = $3 AND COALESCE(fatura_mes, EXTRACT(MONTH FROM data)::int) = $4`,
            [req.usuarioId, id, ano, mes]
        );
        if (!total.rows[0].quantidade) { await client.query("ROLLBACK"); return res.status(400).json({ mensagem: "Não há compras para fechar nesta fatura." }); }
        const fatura = await client.query(
            `INSERT INTO faturas_cartao (cartao_id, usuario_id, ano, mes, status, fechada_em)
             VALUES ($1,$2,$3,$4,'fechada',NOW())
             ON CONFLICT (cartao_id, ano, mes) DO UPDATE
             SET status = 'fechada', fechada_em = NOW(), updated_at = NOW()
             WHERE faturas_cartao.status = 'aberta' RETURNING *`,
            [id, req.usuarioId, ano, mes]
        );
        if (!fatura.rowCount) { await client.query("ROLLBACK"); return res.status(400).json({ mensagem: "Esta fatura já foi fechada ou paga." }); }
        await client.query("COMMIT");
        return res.json({ ...fatura.rows[0], total: total.rows[0].total, quantidade: total.rows[0].quantidade });
    } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
    } finally { client.release(); }
}));

router.post("/:id/faturas/:ano/:mes/pagar", asyncHandler(async (req, res) => {
    const { id, ano, mes } = parametrosFatura(req);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const fatura = await client.query(
            `SELECT f.*, c.nome AS cartao_nome FROM faturas_cartao f JOIN cartoes c ON c.id = f.cartao_id
             WHERE f.cartao_id = $1 AND f.usuario_id = $2 AND f.ano = $3 AND f.mes = $4 FOR UPDATE`,
            [id, req.usuarioId, ano, mes]
        );
        if (!fatura.rowCount) { await client.query("ROLLBACK"); return res.status(404).json({ mensagem: "Feche a fatura antes de pagá-la." }); }
        if (fatura.rows[0].status === "paga") { await client.query("ROLLBACK"); return res.status(400).json({ mensagem: "Esta fatura já foi paga." }); }
        if (fatura.rows[0].status !== "fechada") { await client.query("ROLLBACK"); return res.status(400).json({ mensagem: "A fatura precisa estar fechada para o pagamento." }); }
        const total = await client.query(
            `SELECT COALESCE(SUM(valor), 0)::numeric(12,2) AS total FROM movimentacoes
             WHERE usuario_id = $1 AND cartao_id = $2 AND tipo = 'despesa' AND forma_pagamento = 'credito'
               AND COALESCE(fatura_ano, EXTRACT(YEAR FROM data)::int) = $3 AND COALESCE(fatura_mes, EXTRACT(MONTH FROM data)::int) = $4`,
            [req.usuarioId, id, ano, mes]
        );
        const valor = Number(total.rows[0].total);
        if (!(valor > 0)) { await client.query("ROLLBACK"); return res.status(400).json({ mensagem: "A fatura não possui valor para pagamento." }); }
        const saldo = await client.query(
            `SELECT COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor
                WHEN tipo = 'despesa' AND forma_pagamento = 'saldo' THEN -valor ELSE 0 END), 0)::numeric(12,2) AS valor
             FROM movimentacoes WHERE usuario_id = $1`, [req.usuarioId]
        );
        if (Number(saldo.rows[0].valor) < valor) { await client.query("ROLLBACK"); return res.status(400).json({ mensagem: "Saldo insuficiente para pagar esta fatura." }); }
        const pagamento = await client.query(
            `INSERT INTO movimentacoes (usuario_id, tipo, descricao, valor, categoria, data, forma_pagamento, fatura_pagamento_id)
             VALUES ($1,'despesa',$2,$3,'Pagamento de fatura',CURRENT_DATE,'saldo',$4) RETURNING *`,
            [req.usuarioId, `Pagamento da fatura ${fatura.rows[0].cartao_nome} ${String(mes).padStart(2, "0")}/${ano}`, valor, fatura.rows[0].id]
        );
        const atualizada = await client.query(
            `UPDATE faturas_cartao SET status = 'paga', paga_em = NOW(), pagamento_movimentacao_id = $1, updated_at = NOW()
             WHERE id = $2 RETURNING *`, [pagamento.rows[0].id, fatura.rows[0].id]
        );
        await client.query("COMMIT");
        return res.json({ fatura: atualizada.rows[0], pagamento: pagamento.rows[0] });
    } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
    } finally { client.release(); }
}));

router.delete("/:id", asyncHandler(async (req, res) => {
    const id = idPositivo(req.params.id, "ID do cartão");
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const cartao = await client.query("SELECT id FROM cartoes WHERE id = $1 AND usuario_id = $2 FOR UPDATE", [id, req.usuarioId]);
        if (!cartao.rowCount) { await client.query("ROLLBACK"); return res.status(404).json({ mensagem: "Cartão não encontrado." }); }
        const uso = await client.query(
            `SELECT EXISTS (SELECT 1 FROM movimentacoes WHERE cartao_id = $1 AND usuario_id = $2)
                 OR EXISTS (SELECT 1 FROM faturas_cartao WHERE cartao_id = $1 AND usuario_id = $2) AS em_uso`,
            [id, req.usuarioId]
        );
        if (uso.rows[0]?.em_uso) {
            await client.query("ROLLBACK");
            return res.status(409).json({ mensagem: "Este cartão possui movimentações ou faturas e não pode ser excluído. Preserve-o para manter o histórico." });
        }
        await client.query("DELETE FROM cartoes WHERE id = $1 AND usuario_id = $2", [id, req.usuarioId]);
        await client.query("COMMIT");
        return res.json({ mensagem: "Cartão removido." });
    } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
    } finally { client.release(); }
}));

module.exports = router;
