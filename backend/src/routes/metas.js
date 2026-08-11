const express = require("express");
const { pool } = require("../db");
const { autenticar } = require("../middleware/autenticar");
const { idPositivo } = require("../http");

const router = express.Router();
router.use(autenticar);

const VALOR_MAXIMO = 9_999_999_999.99;

function prazoValido(prazo) {
    if (prazo === undefined || prazo === null || prazo === "") return null;
    if (typeof prazo !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(prazo)) return undefined;
    const data = new Date(`${prazo}T12:00:00Z`);
    return Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== prazo ? undefined : prazo;
}

async function saldoDisponivel(executor, usuarioId) {
    const result = await executor.query(
        `SELECT COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor
            WHEN tipo = 'despesa' AND forma_pagamento = 'saldo' THEN -valor ELSE 0 END), 0)::numeric(12,2) AS valor
         FROM movimentacoes WHERE usuario_id = $1`,
        [usuarioId]
    );
    return Number(result.rows[0].valor);
}

router.get("/", async (req, res, next) => {
    try {
        const result = await pool.query("SELECT * FROM metas WHERE usuario_id = $1 ORDER BY concluida, prazo NULLS LAST, created_at DESC", [req.usuarioId]);
        return res.json(result.rows);
    } catch (error) { return next(error); }
});

router.post("/", async (req, res, next) => {
    const { nome, valor_alvo, valor_atual = 0, prazo } = req.body;
    const valorAlvo = Number(valor_alvo);
    const valorAtualInicial = Number(valor_atual);
    const prazoNormalizado = prazoValido(prazo);
    if (
        typeof nome !== "string" || !nome.trim() || nome.trim().length > 160 ||
        !Number.isFinite(valorAlvo) || valorAlvo <= 0 || valorAlvo > VALOR_MAXIMO ||
        !Number.isFinite(valorAtualInicial) || valorAtualInicial < 0 || valorAtualInicial > VALOR_MAXIMO ||
        prazoNormalizado === undefined
    ) {
        return res.status(400).json({ mensagem: "Dados da meta inválidos." });
    }
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query("SELECT pg_advisory_xact_lock($1)", [req.usuarioId]);
        if (valorAtualInicial > 0 && await saldoDisponivel(client, req.usuarioId) < valorAtualInicial) {
            await client.query("ROLLBACK");
            return res.status(409).json({ mensagem: "Saldo insuficiente para reservar o valor inicial da meta." });
        }
        const result = await client.query(
            `INSERT INTO metas (usuario_id, nome, valor_alvo, valor_atual, prazo, concluida)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [req.usuarioId, nome.trim(), valorAlvo, valorAtualInicial, prazoNormalizado, valorAtualInicial >= valorAlvo]
        );
        if (valorAtualInicial > 0) {
            const movimento = await client.query(
                `INSERT INTO meta_movimentacoes (meta_id, usuario_id, tipo, valor, observacao)
                 VALUES ($1,$2,'deposito',$3,'Valor inicial da meta') RETURNING id`,
                [result.rows[0].id, req.usuarioId, valorAtualInicial]
            );
            await client.query(
                `INSERT INTO movimentacoes
                    (usuario_id, tipo, descricao, valor, categoria, data, forma_pagamento, impacta_resultado, meta_movimentacao_id)
                 VALUES ($1,'despesa',$2,$3,'Metas',CURRENT_DATE,'saldo',FALSE,$4)`,
                [req.usuarioId, `Reserva inicial para meta: ${nome.trim()}`, valorAtualInicial, movimento.rows[0].id]
            );
        }
        await client.query("COMMIT");
        return res.status(201).json(result.rows[0]);
    } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        return next(error);
    } finally { client.release(); }
});

router.put("/:id", async (req, res, next) => {
    let id;
    try { id = idPositivo(req.params.id, "ID da meta"); } catch (error) { return next(error); }
    return res.status(409).json({
        mensagem: "Use a opção de movimentar a meta para alterar o valor acumulado.",
        codigo: "META_MOVIMENTACAO_OBRIGATORIA",
    });
});

router.delete("/:id", async (req, res, next) => {
    let id;
    try { id = idPositivo(req.params.id, "ID da meta"); } catch (error) { return next(error); }
    try {
        const result = await pool.query(
            `DELETE FROM metas
             WHERE id = $1 AND usuario_id = $2 AND valor_atual = 0
             RETURNING id`,
            [id, req.usuarioId]
        );
        if (!result.rowCount) {
            const existe = await pool.query("SELECT valor_atual FROM metas WHERE id = $1 AND usuario_id = $2", [id, req.usuarioId]);
            if (existe.rowCount && Number(existe.rows[0].valor_atual) > 0) {
                return res.status(409).json({ mensagem: "Retire o valor acumulado antes de excluir esta meta." });
            }
        }
        if (!result.rowCount) return res.status(404).json({ mensagem: "Meta não encontrada." });
        return res.json({ mensagem: "Meta removida." });
    } catch (error) { return next(error); }
});

router.get("/:id/historico", async (req, res, next) => {
    let id;
    try { id = idPositivo(req.params.id, "ID da meta"); } catch (error) { return next(error); }
    try {
        const result = await pool.query(
            `SELECT mm.id, mm.tipo, mm.valor, mm.observacao, mm.created_at
             FROM meta_movimentacoes mm JOIN metas m ON m.id = mm.meta_id
             WHERE mm.meta_id = $1 AND m.usuario_id = $2 ORDER BY mm.created_at DESC`,
            [id, req.usuarioId]
        );
        return res.json(result.rows);
    } catch (error) { return next(error); }
});

router.post("/:id/movimentar", async (req, res, next) => {
    let id;
    try { id = idPositivo(req.params.id, "ID da meta"); } catch (error) { return next(error); }
    const { tipo, valor, observacao } = req.body;
    const valorNumero = Number(valor);
    if (
        !["deposito", "retirada"].includes(tipo) ||
        !Number.isFinite(valorNumero) || valorNumero <= 0 || valorNumero > VALOR_MAXIMO ||
        (observacao !== undefined && observacao !== null && typeof observacao !== "string") ||
        (typeof observacao === "string" && observacao.length > 255)
    ) {
        return res.status(400).json({ mensagem: "Movimentação da meta inválida." });
    }
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query("SELECT pg_advisory_xact_lock($1)", [req.usuarioId]);
        const meta = await client.query("SELECT * FROM metas WHERE id = $1 AND usuario_id = $2 FOR UPDATE", [id, req.usuarioId]);
        if (!meta.rowCount) { await client.query("ROLLBACK"); return res.status(404).json({ mensagem: "Meta não encontrada." }); }
        const atual = Number(meta.rows[0].valor_atual);
        const novoValor = tipo === "deposito" ? atual + valorNumero : atual - valorNumero;
        if (novoValor < 0) { await client.query("ROLLBACK"); return res.status(400).json({ mensagem: "A retirada não pode superar o valor acumulado." }); }
        if (novoValor > VALOR_MAXIMO) { await client.query("ROLLBACK"); return res.status(400).json({ mensagem: "O valor acumulado excede o limite permitido." }); }
        if (tipo === "deposito" && await saldoDisponivel(client, req.usuarioId) < valorNumero) {
            await client.query("ROLLBACK");
            return res.status(409).json({ mensagem: "Saldo insuficiente para adicionar esse valor à meta." });
        }
        const atualizada = await client.query(
            "UPDATE metas SET valor_atual = $1, concluida = $1 >= valor_alvo, updated_at = NOW() WHERE id = $2 RETURNING *",
            [novoValor, id]
        );
        const movimento = await client.query(
            "INSERT INTO meta_movimentacoes (meta_id, usuario_id, tipo, valor, observacao) VALUES ($1,$2,$3,$4,$5) RETURNING *",
            [id, req.usuarioId, tipo, valorNumero, observacao?.trim() || null]
        );
        const descricaoFinanceira = tipo === "deposito"
            ? `Reserva para meta: ${meta.rows[0].nome}`
            : `Resgate da meta: ${meta.rows[0].nome}`;
        const movimentacaoFinanceira = await client.query(
            `INSERT INTO movimentacoes
                (usuario_id, tipo, descricao, valor, categoria, data, forma_pagamento, impacta_resultado, meta_movimentacao_id)
             VALUES ($1, $2, $3, $4, 'Metas', CURRENT_DATE, 'saldo', FALSE, $5)
             RETURNING *`,
            [req.usuarioId, tipo === "deposito" ? "despesa" : "receita", descricaoFinanceira, valorNumero, movimento.rows[0].id]
        );
        await client.query("COMMIT");
        return res.json({ meta: atualizada.rows[0], movimentacao: movimento.rows[0], movimentacao_financeira: movimentacaoFinanceira.rows[0] });
    } catch (error) { await client.query("ROLLBACK"); return next(error); }
    finally { client.release(); }
});

module.exports = router;
