// //controller for sessions
import { pool } from "../config/connect_database.js";
import { addNotification } from "./controlNotification.js";

export const createSession = async (req, res) => {
    const user = req.user;
    const user_id = user.user_id;

    try {
        //check for user in db to pull out pulse_level
        const userPulse = await pool.query(
            `
            SELECT pulse_level FROM users WHERE user_id = $1
            `,
            [user_id]
        )
        const activeSession = await pool.query(
            `
            SELECT * FROM sessions WHERE user_id = $1 AND status = 'active'
            `,
            [user_id]
        )

        if (activeSession.rows.length > 0) {
            return res.status(400).json({
                message: "You already have an active session"
            })
        }
        //check if their is a session in waiting state
        const waitingSession = await pool.query(
            `
            SELECT * FROM sessions WHERE user_id = $1 AND status = 'waiting'
            `,
            [user_id]
        )

        if (waitingSession.rows.length > 0) {
            return res.status(400).json({
                message: "You already have a session in waiting state"
            })
        }

        const session = await pool.query(
            `
            INSERT INTO sessions (user_id, status,initial_pulse, created_at) VALUES ($1, 'waiting', $2, NOW()) RETURNING session_id AS id, *;
            `,
            [user_id, userPulse.rows[0].pulse_level]
        )

        res.status(201).json(session.rows[0]);
        //push notification
        await addNotification(
            user_id,
            user.roles,
            null,
            "counselor",
            "session",
            "New session created",
            "You have created a new session"
        )

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error?.message || "Internal server error"
        })
    }

}
export const autoAssignCounselor = async (session_id) => {
    // console.log(session_id);
    try {
        // 1. Get session waiting for assignment
        const sessionResult = await pool.query(
            `SELECT initial_pulse, user_id 
             FROM sessions 
             WHERE session_id = $1 
             AND status = 'waiting'`,
            [session_id]
        );

        if (sessionResult.rows.length === 0) {
            throw new Error("Session not found or not in waiting state");
        }

        const { initial_pulse, user_id } = sessionResult.rows[0];

        // 2. Find least-loaded counselor
        const counselorResult = await pool.query(
            `
            SELECT c.counselor_id, COUNT(s.session_id) AS active_count
            FROM counselors c
            LEFT JOIN sessions s 
                ON c.counselor_id = s.counselor_id 
                AND s.status = 'active'
            WHERE c.is_active = true
            GROUP BY c.counselor_id
            ORDER BY active_count ASC
            LIMIT 1;
            `
        );

        if (counselorResult.rows.length === 0) {
            throw new Error("No available counselors");
        }

        const counselor_id = counselorResult.rows[0].counselor_id;

        // 3. Assign counselor
        const updateResult = await pool.query(
            `
            UPDATE sessions
            SET counselor_id = $1,
                status = 'active',
                started_at = NOW()
            WHERE session_id = $2
            RETURNING session_id AS id, *;
            `,
            [counselor_id, session_id]
        );

        const updatedSession = updateResult.rows[0];

        // 4. Notifications
        await addNotification(
            user_id,
            "user",
            counselor_id,
            "counselor",
            "session_assigned",
            "New Session Assigned",
            "You have been assigned a new session"
        );

        await addNotification(
            counselor_id,
            "counselor",
            user_id,
            "user",
            "session_activated",
            "Session Activated",
            "A counselor has joined your session"
        );

        // return result instead of res.json
        return updatedSession;

    } catch (error) {
        console.error("autoAssignCounselor error:", error);
        throw error;
    }
};
export const autoAssignCounselorController = async (req, res) => {
    try {
        const { session_id } = req.params;

        const session = await autoAssignCounselor(session_id);

        return res.status(200).json({
            message: "Session assigned successfully",
            session
        });

    } catch (error) {
        return res.status(500).json({
            message: error?.message || "Internal server error"
        });
    }
};



export const activateSession = async (req, res) => {
    const { session_id } = req.params;
    const user = req.user;

    try {
        const sessionResult = await pool.query(
            `
            SELECT * FROM sessions WHERE session_id = $1
            `,
            [session_id]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({
                message: "Session not found"
            });
        }

        const session = sessionResult.rows[0];

        // Ensure session is assigned to this counselor OR user is an admin
        if (session.counselor_id !== user.user_id && user.roles !== 'admin') {
            return res.status(403).json({
                message: "You are not authorized to activate this session"
            });
        }

        // Only allow activating from waiting/pending states
        if (session.status === 'active') {
            return res.status(400).json({
                message: "Session is already active"
            });
        }

        const updateResult = await pool.query(
            `
            UPDATE sessions
            SET status = 'active',
                started_at = NOW()
            WHERE session_id = $1
            RETURNING session_id AS id, *;
            `,
            [session_id]
        );

        const updatedSession = updateResult.rows[0];

        // Notify the user that their session was activated
        await addNotification(
            updatedSession.user_id,
            "user",
            user.user_id,
            "counselor",
            "session_activated",
            "Session Activated",
            "Your counselor has joined the session"
        );

        res.status(200).json({
            message: "Session activated successfully",
            session: updatedSession
        });
    } catch (error) {
        console.error("activateSession error:", error);
        return res.status(500).json({
            message: error?.message || "Internal server error"
        });
    }
};

//end session
export const endSession = async (req, res) => {
    const { session_id } = req.params;
    const user = req.user;

    try {

        let selectQuery;
        let selectValues;

        // counselor can only end their own sessions
        if (user.roles === "counselor") {
            selectQuery = `
                SELECT * FROM sessions
                WHERE session_id = $1
                AND counselor_id = $2
                AND status = 'active'
            `;
            selectValues = [session_id, user.counselor_id];

        } else {
            // admin can end any session
            selectQuery = `
                SELECT * FROM sessions
                WHERE session_id = $1
                AND status = 'active'
            `;
            selectValues = [session_id];
        }

        const sessionResult = await pool.query(selectQuery, selectValues);

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({
                message: "Active session not found or not allowed"
            });
        }

        const updated = await pool.query(
            `
            UPDATE sessions
            SET status = 'ended',
                ended_at = NOW()
            WHERE session_id = $1
            RETURNING *
            `,
            [session_id]
        );

        return res.status(200).json({
            message: "Session ended successfully",
            session: updated.rows[0]
        });

    } catch (error) {
        console.error("endSession error:", error);
        return res.status(500).json({
            message: error?.message || "Internal server error"
        });
    }
};

//getting sessions
//admins can get all
//counselors can get all sessions assigned to them 
//users can get all sessions assigned to them

export const getSessions = async (req, res) => {
    const user = req.user;
    const user_id = user.user_id;
    try {
        let sessions;
        if (user.roles === "admin") {
            sessions = await pool.query(
                `
                SELECT session_id AS id, * FROM sessions
                `
            )
        } else if (user.roles === "counselor") {
            sessions = await pool.query(
                `
                SELECT session_id AS id, * FROM sessions WHERE counselor_id = $1
                `,
                [user_id]
            )
        } else if (user.roles === "user") {
            sessions = await pool.query(
                `
                SELECT session_id AS id, * FROM sessions WHERE user_id = $1
                `,
                [user_id]
            )
        }
        res.status(200).json(sessions.rows);
    } catch (error) {
        console.error("getSessions error:", error);
        return res.status(500).json({
            message: error?.message || "Internal server error"
        })
    }
}

//delete session
//admins can delete any session
//counselors can delete their own sessions
//users can delete their own sessions

export const deleteSession = async (req, res) => {
    const { session_id } = req.params;
    const user = req.user;
    const user_id = user.user_id;
    try {
        const sessionResult = await pool.query(
            `
            SELECT * FROM sessions WHERE session_id = $1
            `
            [session_id]
        )
        if (sessionResult.rows.length === 0) {
            return res.status(404).json({
                message: "Session not found"
            })
        }
        const session = sessionResult.rows[0];
        if (user.roles === "admin") {
            await pool.query(
                `
                DELETE FROM sessions WHERE session_id = $1
                `
                [session_id]
            )
        } else if (user.roles === "counselor") {
            if (session.counselor_id !== user_id) {
                return res.status(403).json({
                    message: "You are not authorized to delete this session"
                })
            }
            await pool.query(
                `
                DELETE FROM sessions WHERE session_id = $1
                `
                [session_id]
            )
        } else if (user.roles === "user") {
            if (session.user_id !== user_id) {
                return res.status(403).json({
                    message: "You are not authorized to delete this session"
                })
            }
            await pool.query(
                `
                DELETE FROM sessions WHERE session_id = $1
                `
                [session_id]
            )
        }
        res.status(200).json({
            message: "Session deleted successfully",
            session: session
        })
    }
    catch (error) {
        console.error("deleteSession error:", error);
        return res.status(500).json({
            message: error?.message || "Internal server error"
        })
    }
}

