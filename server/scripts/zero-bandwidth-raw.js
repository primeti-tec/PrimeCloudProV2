
import pg from 'pg';
const { Pool } = pg;

// Read DATABASE_URL from environment or hardcode based on known config
// Since we are in a script, we can read process.env if loaded, but let's try to load .env first or just hardcode for this one-off if safe.
// Better: Use dotenv.

import dotenv from 'dotenv';
dotenv.config();

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not found in .env");
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    console.log("Connecting to database...");
    const client = await pool.connect();
    try {
        console.log("Updating products...");
        const res = await client.query('UPDATE products SET price_per_transfer_gb = 0 RETURNING name, price_per_transfer_gb');
        console.log("Updated rows:", res.rows);
        console.log("Success! Bandwidth cost set to 0.");
    } catch (err) {
        console.error("Error executing query", err);
    } finally {
        client.release();
        pool.end();
    }
}

run();
