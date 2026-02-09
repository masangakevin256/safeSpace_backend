import { pool } from "../config/connect_database.js";

export const createSafetyFlag = async ({ user_id, type, source, mood, note }) => {
    try {
        await pool.query(
            `INSERT INTO safety_flags 
            (user_id, type, source, mood, note)
            VALUES ($1, $2, $3, $4, $5)
            `,
            [user_id, type, source, mood, note]
        );
    } catch (error) {
        console.log("safetyFlagsError", error?.message);
        throw new Error("Failed to insert into safety flags");
    }
};