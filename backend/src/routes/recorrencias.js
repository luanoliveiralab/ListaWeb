const express = require("express");
const { pool } = require("../db");
const { autenticar } = require("../middleware/autenticar");
const { idPositivo, periodoValido } = require("../http");

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
    const { tipo, descricao, valor, categoria, dia, inicio, fim } = req.body;
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
    try {
        const result = await pool.query(
            `INSERT INTO recorrencias (usuario_id, tipo, descricao, valor, categoria, dia, inicio, fim)
             VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,CURRENT_DATE),$8) RETURNING *`,
            [req.usuarioId, tipo, descricao.trim(), valorNumero, categoria.trim(), Number(dia), inicioNormalizado, fimNormalizado]
        );
        return res.status(201).json(result.rows[0]);
    } catch (error) { return next(error); }
});

router.put("/:id", async (req, res, next) => {
    let id;
    try { id = idPositivo(req.params.id, "ID da recorrência"); } catch (error) { return next(error); }
    if (typeof req.body.ativa !== "boolean") {
        return res.status(400).json({ mensagem: "O estado da recorrência deve ser verdadeiro ou falso." });
    }
    try {
        const result = await pool.query("UPDATE recorrencias SET ativa = $1 WHERE id = $2 AND usuario_id = $3 RETURNING *", [req.body.ativa, id, req.usuarioId]);
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
