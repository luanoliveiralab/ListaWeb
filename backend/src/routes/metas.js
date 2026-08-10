const express = require("express");
const { pool } = require("../db");
const { autenticar } = require("../middleware/autenticar");
const { idPositivo } = require("../http");

const router = express.Router();
router.use(autenticar);

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
    if (!nome?.trim() || !Number.isFinite(valorAlvo) || valorAlvo <= 0 || !Number.isFinite(valorAtualInicial) || valorAtualInicial < 0) {
        return res.status(400).json({ mensagem: "Dados da meta inválidos." });
    }
    try {
        const result = await pool.query(
            `INSERT INTO metas (usuario_id, nome, valor_alvo, valor_atual, prazo, concluida)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [req.usuarioId, nome.trim(), valorAlvo, valorAtualInicial, prazo || null, valorAtualInicial >= valorAlvo]
        );
        return res.status(201).json(result.rows[0]);
    } catch (error) { return next(error); }
});

router.put("/:id", async (req, res, next) => {
    let id;
    try { id = idPositivo(req.params.id, "ID da meta"); } catch (error) { return next(error); }
    const valorAtual = Number(req.body.valor_atual);
    if (valorAtual < 0 || !Number.isFinite(valorAtual)) return res.status(400).json({ mensagem: "Valor inválido." });
    try {
        const result = await pool.query(
            `UPDATE metas SET valor_atual = $1, concluida = $1 >= valor_alvo, updated_at = NOW()
             WHERE id = $2 AND usuario_id = $3 RETURNING *`,
            [valorAtual, id, req.usuarioId]
        );
        if (!result.rowCount) return res.status(404).json({ mensagem: "Meta não encontrada." });
        return res.json(result.rows[0]);
    } catch (error) { return next(error); }
});

router.delete("/:id", async (req, res, next) => {
    let id;
    try { id = idPositivo(req.params.id, "ID da meta"); } catch (error) { return next(error); }
    try {
        const result = await pool.query("DELETE FROM metas WHERE id = $1 AND usuario_id = $2 RETURNING id", [id, req.usuarioId]);
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
    if (!["deposito", "retirada"].includes(tipo) || !Number.isFinite(valorNumero) || valorNumero <= 0 || (observacao && String(observacao).length > 255)) {
        return res.status(400).json({ mensagem: "Movimentação da meta inválida." });
    }
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const meta = await client.query("SELECT * FROM metas WHERE id = $1 AND usuario_id = $2 FOR UPDATE", [id, req.usuarioId]);
        if (!meta.rowCount) { await client.query("ROLLBACK"); return res.status(404).json({ mensagem: "Meta não encontrada." }); }
        const atual = Number(meta.rows[0].valor_atual);
        const novoValor = tipo === "deposito" ? atual + valorNumero : atual - valorNumero;
        if (novoValor < 0) { await client.query("ROLLBACK"); return res.status(400).json({ mensagem: "A retirada não pode superar o valor acumulado." }); }
        const atualizada = await client.query(
            "UPDATE metas SET valor_atual = $1, concluida = $1 >= valor_alvo, updated_at = NOW() WHERE id = $2 RETURNING *",
            [novoValor, id]
        );
        const movimento = await client.query(
            "INSERT INTO meta_movimentacoes (meta_id, usuario_id, tipo, valor, observacao) VALUES ($1,$2,$3,$4,$5) RETURNING *",
            [id, req.usuarioId, tipo, valorNumero, observacao?.trim() || null]
        );
        await client.query("COMMIT");
        return res.json({ meta: atualizada.rows[0], movimentacao: movimento.rows[0] });
    } catch (error) { await client.query("ROLLBACK"); return next(error); }
    finally { client.release(); }
});

module.exports = router;
