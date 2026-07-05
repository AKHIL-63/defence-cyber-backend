const { Pool } = require("pg");
require("dotenv").config();

let pool;

if (process.env.DATABASE_URL) {
    // Used on Render, and optionally locally too if you set DATABASE_URL
    // in your own .env file. Render's Postgres requires SSL for external
    // connections. Local Postgres (DATABASE_URL containing "localhost")
    // does not need SSL, so we skip it in that case.
    const isLocal = process.env.DATABASE_URL.includes("localhost");

    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: isLocal ? false : { rejectUnauthorized: false }
    });
} else {
    // Fallback for local development if you prefer separate DB_* variables
    // instead of a single DATABASE_URL.
    pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT
    });
}

module.exports = pool;
