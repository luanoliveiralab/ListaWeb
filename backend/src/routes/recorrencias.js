const express = require("express");
const { pool } = require("../db");
const { autenticar } = require("../middleware/autenticar");
const { idPositivo, periodoValido } = require("../http");
const { buscarCartaoComUso, possuiLimite } = require("../credit");

const router = express.Router();
router.use(autenticar);

const VALOR_MAXIMO = 9_999_999_999.99;

function dataIsoValida(valor) {
    if (valor === undefined || valor === null || valor === "") return null;
    if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return undefined;
    const data = new Date(`${valor}T12:00:00Z`);
    return Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== valor ? undefined : valor;
}

router.get("/", async (req, res, next) => {
    try {
        const result = await pool.query("SELECT * FROM recorrencias WHERE usuario_id = $1 ORDER BY ativa DESC, dia, descricao", [req.usuarioId]);
        return res.json(result.rows);
    } catch (error) { return next(error); }
});

router.post("/", async (req, res, next) => {
    const { tipo, descricao, valor, categoria, dia, inicio, fim, forma_pagamento, cartao_id } = req.body;
    const valorNumero = Number(valor);
    const inicioNormalizado = dataIsoValida(inicio);
    const fimNormalizado = dataIsoValida(fim);
    if (
        !["receita", "despesa"].includes(tipo) ||
        typeof descricao !== "string" || !descricao.trim() || descricao.trim().length > 255 ||
        typeof categoria !== "string" || !categoria.trim() || categoria.trim().length > 80 ||
        !Number.isFinite(valorNumero) || valorNumero <= 0 || valorNumero > VALOR_MAXIMO ||
        !Number.isInteger(Number(dia)) || Number(dia) < 1 || Number(dia) > 28 ||
        inicioNormalizado === undefined || fimNormalizado === undefined ||
        (inicioNormalizado && fimNormalizado && fimNormalizado < inicioNormalizado)
    ) {
        return res.status(400).json({ mensagem: "Dados da recorrência inválidos." });
    }
    if (forma_pagamento !== undefined && !["saldo", "credito"].includes(forma_pagamento)) {
        return res.status(400).json({ mensagem: "Forma de pagamento inválida." });
    }
    const formaPagamento = tipo === "despesa" && forma_pagamento === "credito" ? "credito" : "saldo";
    const cartaoId = formaPagamento === "credito" ? Number(cartao_id) : null;
    if (formaPagamento === "credito" && (!Number.isInteger(cartaoId) || cartaoId <= 0)) {
        return res.status(400).json({ mensagem: "Selecione um cartão para a despesa recorrente." });
    }
    try {
        if (cartaoId) {
            const cartao = await pool.query("SELECT 1 FROM cartoes WHERE id = $1 AND usuario_id = $2", [cartaoId, req.usuarioId]);
            if (!cartao.rowCount) return res.status(400).json({ mensagem: "Cartão inválido." });
        }
        const result = await pool.query(
            `INSERT INTO recorrencias (usuario_id, tipo, descricao, valor, categoria, dia, inicio, fim, forma_pagamento, cartao_id)
             VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,CURRENT_DATE),$8,$9,$10) RETURNING *`,
            [req.usuarioId, tipo, descricao.trim(), valorNumero, categoria.trim(), Number(dia), inicioNormalizado, fimNormalizado, formaPagamento, cartaoId]
        );
        return res.status(201).json(result.rows[0]);
    } catch (error) { return next(error); }
});

router.put("/:id", async (req, res, next) => {
    let id;
    try { id = idPositivo(req.params.id, "ID da recorrência"); } catch (error) { return next(error); }
    try {
        if (typeof req.body.ativa === "boolean" && Object.keys(req.body).length === 1) {
            const result = await pool.query("UPDATE recorrencias SET ativa = $1 WHERE id = $2 AND usuario_id = $3 RETURNING *", [req.body.ativa, id, req.usuarioId]);
            if (!result.rowCount) return res.status(404).json({ mensagem: "Recorrência não encontrada." });
            return res.json(result.rows[0]);
        }
        const { tipo, descricao, valor, categoria, dia, forma_pagamento, cartao_id } = req.body;
        const valorNumero = Number(valor);
        if (!['receita', 'despesa'].includes(tipo) || typeof descricao !== 'string' || !descricao.trim() || descricao.trim().length > 255 || typeof categoria !== 'string' || !categoria.trim() || categoria.trim().length > 80 || !Number.isFinite(valorNumero) || valorNumero <= 0 || valorNumero > VALOR_MAXIMO || !Number.isInteger(Number(dia)) || Number(dia) < 1 || Number(dia) > 28 || (forma_pagamento !== undefined && !['saldo', 'credito'].includes(forma_pagamento))) {
            return res.status(400).json({ mensagem: "Dados da recorrência inválidos." });
        }
        const formaPagamento = tipo === 'despesa' && forma_pagamento === 'credito' ? 'credito' : 'saldo';
        const cartaoId = formaPagamento === 'credito' ? Number(cartao_id) : null;
        if (formaPagamento === 'credito' && (!Number.isInteger(cartaoId) || cartaoId <= 0)) return res.status(400).json({ mensagem: "Selecione um cartão para a despesa recorrente." });
        if (cartaoId) {
            const cartao = await pool.query("SELECT 1 FROM cartoes WHERE id = $1 AND usuario_id = $2", [cartaoId, req.usuarioId]);
            if (!cartao.rowCount) return res.status(400).json({ mensagem: "Cartão inválido." });
        }
        const result = await pool.query(
            `UPDATE recorrencias SET tipo = $1, descricao = $2, valor = $3, categoria = $4, dia = $5, forma_pagamento = $6, cartao_id = $7
             WHERE id = $8 AND usuario_id = $9 RETURNING *`,
            [tipo, descricao.trim(), valorNumero, categoria.trim(), Number(dia), formaPagamento, cartaoId, id, req.usuarioId]
        );
        if (!result.rowCount) return res.status(404).json({ mensagem: "Recorrência não encontrada." });
        return res.json(result.rows[0]);
    } catch (error) { return next(error); }
});

router.delete("/:id", async (req, res, next) => {
    let id;
    try { id = idPositivo(req.params.id, "ID da recorrência"); } catch (error) { return next(error); }
    try {
        const result = await pool.query("DELETE FROM recorrencias WHERE id = $1 AND usuario_id = $2 RETURNING id", [id, req.usuarioId]);
        if (!result.rowCount) return res.status(404).json({ mensagem: "Recorrência não encontrada." });
        return res.json({ mensagem: "Recorrência removida." });
    } catch (error) { return next(error); }
});

router.post("/gerar", async (req, res, next) => {
    const hoje = new Date();
    let mes;
    let ano;
    try {
        ({ mes, ano } = periodoValido(req.body.mes ?? hoje.getMonth() + 1, req.body.ano ?? hoje.getFullYear()));
    } catch (error) { return next(error); }
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query(
            `DELETE FROM movimentacoes
             WHERE usuario_id = $1
               AND recorrencia_id IS NOT NULL
               AND data > CURRENT_DATE`,
            [req.usuarioId]
        );
        const programadas = await client.query(
            `SELECT *, make_date($2, $3, dia) AS data_programada
             FROM recorrencias WHERE usuario_id = $1 AND ativa = TRUE
               AND make_date($2, $3, dia) >= inicio
               AND (fim IS NULL OR make_date($2, $3, dia) <= fim)
               AND make_date($2, $3, dia) <= CURRENT_DATE
             ORDER BY dia, id FOR UPDATE`,
            [req.usuarioId, ano, mes]
        );
        let geradas = 0;
        let ignoradasPorCredito = 0;
        for (const recorrencia of programadas.rows) {
            if (recorrencia.tipo === "despesa" && recorrencia.forma_pagamento === "credito") {
                const cartao = await buscarCartaoComUso(client, req.usuarioId, recorrencia.cartao_id, { bloquear: true });
                if (!cartao || !possuiLimite(cartao, Number(recorrencia.valor))) {
                    ignoradasPorCredito += 1;
                    continue;
                }
            }
            const inserida = await client.query(
                `INSERT INTO movimentacoes (usuario_id, tipo, descricao, valor, categoria, data, recorrencia_id, forma_pagamento, cartao_id)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                 ON CONFLICT (recorrencia_id, data) WHERE recorrencia_id IS NOT NULL DO NOTHING
                 RETURNING id`,
                [req.usuarioId, recorrencia.tipo, recorrencia.descricao, recorrencia.valor, recorrencia.categoria, recorrencia.data_programada, recorrencia.id, recorrencia.forma_pagamento, recorrencia.cartao_id]
            );
            geradas += inserida.rowCount;
        }
        const pendentes = await client.query(
            `SELECT * FROM movimentacoes_programadas
             WHERE usuario_id = $1 AND lancada_em IS NULL AND data_programada <= CURRENT_DATE
             ORDER BY data_programada, id FOR UPDATE`,
            [req.usuarioId]
        );
        for (const programada of pendentes.rows) {
            if (programada.tipo === "despesa" && programada.forma_pagamento === "credito") {
                const cartao = await buscarCartaoComUso(client, req.usuarioId, programada.cartao_id, { bloquear: true });
                if (!cartao || !possuiLimite(cartao, Number(programada.valor))) {
                    ignoradasPorCredito += 1;
                    continue;
                }
            }
            const inserida = await client.query(
                `INSERT INTO movimentacoes (usuario_id, tipo, descricao, valor, categoria, data, forma_pagamento, cartao_id)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
                [req.usuarioId, programada.tipo, programada.descricao, programada.valor, programada.categoria, programada.data_programada, programada.forma_pagamento, programada.cartao_id]
            );
            await client.query(
                "UPDATE movimentacoes_programadas SET movimentacao_id = $1, lancada_em = NOW() WHERE id = $2",
                [inserida.rows[0].id, programada.id]
            );
            geradas += 1;
        }
        await client.query("COMMIT");
        const movimentacoes = await pool.query(
            `SELECT m.*, l.quantidade AS quantidade, c.nome AS cartao_nome
             FROM movimentacoes m
             LEFT JOIN listas l ON l.movimentacao_id = m.id
             LEFT JOIN cartoes c ON c.id = m.cartao_id
             WHERE m.usuario_id = $1
               AND m.data >= make_date($2, $3, 1)
               AND m.data < make_date($2, $3, 1) + INTERVAL '1 month'
             ORDER BY m.data DESC, m.id DESC`,
            [req.usuarioId, ano, mes]
        );
        return res.json({ geradas, ignoradas_por_credito: ignoradasPorCredito, movimentacoes: movimentacoes.rows });
    } catch (error) { await client.query("ROLLBACK").catch(() => undefined); return next(error); }
    finally { client.release(); }
});

module.exports = router;
