import { Pool } from "pg";


export const pool = new Pool({
  connectionString: process.env.DATABASE_URI,
  ssl: { rejectUnauthorized: false },

  max: 10,                 // max number of clients in the pool
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 60000, // 60 seconds

});
