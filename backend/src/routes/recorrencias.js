const express = require("express");
const { pool } = require("../db");
const { autenticar } = require("../middleware/autenticar");

const router = express.Router();
router.use(autenticar);

function idValido(valor) {
    const id = Number(valor);
    return Number.isInteger(id) && id > 0 ? id : null;
}

router.get("/", async (req, res, next) => {
    try {
        const result = await pool.query("SELECT * FROM recorrencias WHERE usuario_id = $1 ORDER BY ativa DESC, dia, descricao", [req.usuarioId]);
        return res.json(result.rows);
    } catch (error) { return next(error); }
});

router.post("/", async (req, res, next) => {
    const { tipo, descricao, valor, categoria, dia, inicio, fim } = req.body;
    if (!["receita", "despesa"].includes(tipo) || !descricao?.trim() || !categoria?.trim() || !(Number(valor) > 0) || !Number.isInteger(Number(dia)) || Number(dia) < 1 || Number(dia) > 28) {
        return res.status(400).json({ mensagem: "Dados da recorrência inválidos." });
    }
    try {
        const result = await pool.query(
            `INSERT INTO recorrencias (usuario_id, tipo, descricao, valor, categoria, dia, inicio, fim)
             VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,CURRENT_DATE),$8) RETURNING *`,
            [req.usuarioId, tipo, descricao.trim(), Number(valor), categoria.trim(), Number(dia), inicio || null, fim || null]
        );
        return res.status(201).json(result.rows[0]);
    } catch (error) { return next(error); }
});

router.put("/:id", async (req, res, next) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ mensagem: "ID da recorrência inválido." });
    try {
        const result = await pool.query("UPDATE recorrencias SET ativa = $1 WHERE id = $2 AND usuario_id = $3 RETURNING *", [Boolean(req.body.ativa), id, req.usuarioId]);
        if (!result.rowCount) return res.status(404).json({ mensagem: "Recorrência não encontrada." });
        return res.json(result.rows[0]);
    } catch (error) { return next(error); }
});

router.delete("/:id", async (req, res, next) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ mensagem: "ID da recorrência inválido." });
    try {
        const result = await pool.query("DELETE FROM recorrencias WHERE id = $1 AND usuario_id = $2 RETURNING id", [id, req.usuarioId]);
        if (!result.rowCount) return res.status(404).json({ mensagem: "Recorrência não encontrada." });
        return res.json({ mensagem: "Recorrência removida." });
    } catch (error) { return next(error); }
});

router.post("/gerar", async (req, res, next) => {
    const hoje = new Date();
    const mes = Number(req.body.mes ?? hoje.getMonth() + 1);
    const ano = Number(req.body.ano ?? hoje.getFullYear());
    if (mes < 1 || mes > 12 || ano < 2000 || ano > 2200) return res.status(400).json({ mensagem: "Período inválido." });
    try {
        const result = await pool.query(
            `INSERT INTO movimentacoes (usuario_id, tipo, descricao, valor, categoria, data, recorrencia_id)
             SELECT usuario_id, tipo, descricao, valor, categoria, make_date($2, $3, dia), id
             FROM recorrencias WHERE usuario_id = $1 AND ativa = TRUE
               AND make_date($2, $3, dia) >= inicio
               AND (fim IS NULL OR make_date($2, $3, dia) <= fim)
             ON CONFLICT (recorrencia_id, data) WHERE recorrencia_id IS NOT NULL DO NOTHING
             RETURNING *`,
            [req.usuarioId, ano, mes]
        );
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
        return res.json({ geradas: result.rowCount, movimentacoes: movimentacoes.rows });
    } catch (error) { return next(error); }
});

module.exports = router;
