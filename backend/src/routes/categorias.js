const express = require("express");
const { pool } = require("../db");
const { autenticar } = require("../middleware/autenticar");
const { asyncHandler, idPositivo, HttpError } = require("../http");
const { booleanoOpcional } = require("../validation");

const router = express.Router();
router.use(autenticar);

const padroes = {
    receita: ["Salário", "Freelance", "Outros"],
    despesa: ["Mercado", "Moradia", "Transporte"],
};

function validar(body) {
    const nome = typeof body?.nome === "string" ? body.nome.trim().replace(/\s+/g, " ") : "";
    const tipo = body?.tipo;
    if (!nome || nome.length > 80 || !["receita", "despesa"].includes(tipo)) {
        throw new HttpError(400, "Dados da categoria inválidos.", "CATEGORIA_INVALIDA");
    }
    const aplica_lista = booleanoOpcional(body, "aplica_lista");
    const aplica_financas = booleanoOpcional(body, "aplica_financas");
    const aplica_planejamento = booleanoOpcional(body, "aplica_planejamento");
    if (![aplica_lista, aplica_financas, aplica_planejamento].some(Boolean)) {
        throw new HttpError(400, "Escolha ao menos uma página para a categoria.", "CATEGORIA_SEM_PAGINA");
    }
    return { nome, tipo, aplica_lista, aplica_financas, aplica_planejamento };
}

async function garantirPadroes(usuarioId) {
    const existentes = await pool.query("SELECT 1 FROM categorias WHERE usuario_id = $1 LIMIT 1", [usuarioId]);
    if (existentes.rowCount) return;
    const valores = Object.entries(padroes).flatMap(([tipo, nomes]) => nomes.map((nome) => [usuarioId, nome, tipo]));
    const parametros = valores.flat();
    const grupos = valores.map((_, indice) => `($${indice * 3 + 1},$${indice * 3 + 2},$${indice * 3 + 3})`).join(",");
    await pool.query(
        `INSERT INTO categorias (usuario_id, nome, tipo) VALUES ${grupos}
         ON CONFLICT (usuario_id, LOWER(nome), tipo) DO NOTHING`, parametros
    );
}

router.get("/", asyncHandler(async (req, res) => {
    await garantirPadroes(req.usuarioId);
    const result = await pool.query(
        "SELECT id, nome, tipo, aplica_lista, aplica_financas, aplica_planejamento, created_at, updated_at FROM categorias WHERE usuario_id = $1 ORDER BY tipo DESC, nome",
        [req.usuarioId]
    );
    return res.json(result.rows);
}));

router.post("/", asyncHandler(async (req, res) => {
    const { nome, tipo, aplica_lista, aplica_financas, aplica_planejamento } = validar(req.body);
    try {
        const result = await pool.query(
            "INSERT INTO categorias (usuario_id, nome, tipo, aplica_lista, aplica_financas, aplica_planejamento) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, nome, tipo, aplica_lista, aplica_financas, aplica_planejamento, created_at, updated_at",
            [req.usuarioId, nome, tipo, aplica_lista, aplica_financas, aplica_planejamento]
        );
        return res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === "23505") throw new HttpError(409, "Esta categoria já existe.", "CATEGORIA_DUPLICADA");
        throw error;
    }
}));

router.put("/:id", asyncHandler(async (req, res) => {
    const id = idPositivo(req.params.id, "ID da categoria");
    const { nome, tipo, aplica_lista, aplica_financas, aplica_planejamento } = validar(req.body);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const atual = await client.query("SELECT nome, tipo FROM categorias WHERE id = $1 AND usuario_id = $2 FOR UPDATE", [id, req.usuarioId]);
        if (!atual.rowCount) { await client.query("ROLLBACK"); return res.status(404).json({ mensagem: "Categoria não encontrada." }); }
        const anterior = atual.rows[0];
        const result = await client.query(
            "UPDATE categorias SET nome = $1, tipo = $2, aplica_lista = $3, aplica_financas = $4, aplica_planejamento = $5, updated_at = NOW() WHERE id = $6 RETURNING id, nome, tipo, aplica_lista, aplica_financas, aplica_planejamento, created_at, updated_at",
            [nome, tipo, aplica_lista, aplica_financas, aplica_planejamento, id]
        );
        if (anterior.nome !== nome) {
            for (const tabela of ["movimentacoes", "recorrencias"]) {
                await client.query(`UPDATE ${tabela} SET categoria = $1 WHERE usuario_id = $2 AND categoria = $3 AND tipo = $4`, [nome, req.usuarioId, anterior.nome, anterior.tipo]);
            }
            if (anterior.tipo === "despesa") {
                for (const tabela of ["listas", "orcamentos"]) {
                    await client.query(`UPDATE ${tabela} SET categoria = $1 WHERE usuario_id = $2 AND categoria = $3`, [nome, req.usuarioId, anterior.nome]);
                }
            }
        }
        await client.query("COMMIT");
        return res.json(result.rows[0]);
    } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        if (error.code === "23505") throw new HttpError(409, "Já existem dados usando essa categoria ou nome.", "CATEGORIA_DUPLICADA");
        throw error;
    } finally { client.release(); }
}));

router.delete("/:id", asyncHandler(async (req, res) => {
    const id = idPositivo(req.params.id, "ID da categoria");
    const result = await pool.query("DELETE FROM categorias WHERE id = $1 AND usuario_id = $2 RETURNING id", [id, req.usuarioId]);
    if (!result.rowCount) return res.status(404).json({ mensagem: "Categoria não encontrada." });
    return res.json({ mensagem: "Categoria removida. Os lançamentos existentes foram preservados." });
}));

module.exports = router;
module.exports.validarCategoria = validar;
module.exports.categoriasPadrao = padroes;
