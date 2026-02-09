import "dotenv/config";
import { pool } from "./config/connect_database.js";

async function verifyConnection() {
    try {
        console.log("Attempting to connect to DB...");
        console.log(`Connecting to host: ${pool.options.host || 'default (localhost)'}`); // pg pool might not expose host easily on options if parsed from connection string, let's try to infer or just run query

        // Explicitly check env var first
        if (!process.env.DATABASE_URI) {
            console.error("ERROR: DATABASE_URI is still undefined!");
            process.exit(1);
        } else {
            console.log("DATABASE_URI is defined (length: " + process.env.DATABASE_URI.length + ")");
        }

        const res = await pool.query('SELECT NOW()');
        console.log("Connection Successful! DB Time:", res.rows[0].now);
        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error("Connection Failed:", err);
        process.exit(1);
    }
}

verifyConnection();



