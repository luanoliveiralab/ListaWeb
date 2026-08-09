require("dotenv").config();
const fs = require("node:fs/promises");
const path = require("node:path");
const { pool } = require("../src/db");

async function executar() {
    const sql = await fs.readFile(path.join(__dirname, "../migrations/001_initial.sql"), "utf8");
    await pool.query(sql);
    console.log("Migração aplicada com sucesso.");
}

executar()
    .catch((error) => { console.error("Falha na migração:", error.message); process.exitCode = 1; })
    .finally(() => pool.end());
