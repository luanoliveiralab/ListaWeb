const { Pool } = require("pg");

const pool = new Pool(process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false },
    }
    : {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
        ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    });

async function verificarConexao() {
    await pool.query("SELECT 1");
}

module.exports = { pool, verificarConexao };
