import { pool } from "../config/connect_database.js";

// Create feedback
export const createFeedback = async (req, res) => {
    const { session_id, rating, comment } = req.body;

    if (!session_id || !rating) {
        return res.status(400).json({ message: "Session ID and rating are required" });
    }

    try {
        //check if session_id is correct
        const session = await pool.query("SELECT * FROM sessions WHERE session_id = $1", [session_id]);
        if (session.rows.length === 0) {
            return res.status(404).json({ message: "Session not found" });
        }
        //check if user has already given feedback for this session
        const feedback = await pool.query("SELECT * FROM feedback WHERE session_id = $1", [session_id]);
        if (feedback.rows.length > 0) {
            return res.status(400).json({ message: "Feedback already given for this session" });
        }
        const result = await pool.query(
            "INSERT INTO feedback (session_id, rating, comment) VALUES ($1, $2, $3) RETURNING *",
            [session_id, rating, comment]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// Get all feedbacks
export const getAllFeedbacks = async (req, res) => {
    const { roles, user_id, counselor_id, admin_id } = req.user;
    
    try {
        let feedbacks;
        if (roles === "counselor") {
            const idValue = counselor_id;
            feedbacks = await pool.query(
                `
                SELECT f.* FROM feedback f
                JOIN sessions s ON f.session_id = s.session_id
                WHERE s.counselor_id = $1
                ORDER BY f.created_at DESC
                `,
                [idValue]
            );
        } else if (roles === "admin") {
            feedbacks = await pool.query("SELECT * FROM feedback ORDER BY created_at DESC");
        } else {
            // "user" role - feedback linked via sessions table
            const idValue = user_id;
            feedbacks = await pool.query(
                `
                SELECT f.* FROM feedback f
                JOIN sessions s ON f.session_id = s.session_id
                WHERE s.user_id = $1
                ORDER BY f.created_at DESC
                `,
                [idValue]
            );
        }
        res.status(200).json(feedbacks.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// Get feedback by ID
export const getFeedbackById = async (req, res) => {
    const { id } = req.params;
    const { roles, user_id, counselor_id, admin_id } = req.user;
    
    try {
        let feedback;
        if (roles === "counselor") {
            feedback = await pool.query(
                `
                SELECT f.* FROM feedback f
                JOIN sessions s ON f.session_id = s.session_id
                WHERE f.feedback_id = $1 AND s.counselor_id = $2
                `,
                [id, counselor_id]
            );
        } else if (roles === "admin") {
            feedback = await pool.query("SELECT * FROM feedback WHERE feedback_id = $1", [id]);
        } else {
            // "user" role
            feedback = await pool.query(
                `
                SELECT f.* FROM feedback f
                JOIN sessions s ON f.session_id = s.session_id
                WHERE f.feedback_id = $1 AND s.user_id = $2
                `,
                [id, user_id]
            );
        }
        
        if (feedback.rows.length === 0) {
            return res.status(404).json({ message: "Feedback not found" });
        }
        res.status(200).json(feedback.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// Delete feedback
export const deleteFeedback = async (req, res) => {
    const { id } = req.params;
    const { roles, user_id, counselor_id, admin_id } = req.user;
    
    try {
        let result;
        if (roles === "admin") {
            result = await pool.query("DELETE FROM feedback WHERE feedback_id = $1 RETURNING *", [id]);
        } else if (roles === "counselor") {
            // Delete feedback only if linked to counselor's session
            result = await pool.query(
                `
                DELETE FROM feedback 
                WHERE feedback_id = $1 AND session_id IN (
                    SELECT session_id FROM sessions WHERE counselor_id = $2
                ) RETURNING *
                `,
                [id, counselor_id]
            );
        } else if (roles === "user") {
            // Delete feedback only if linked to user's session
            result = await pool.query(
                `
                DELETE FROM feedback 
                WHERE feedback_id = $1 AND session_id IN (
                    SELECT session_id FROM sessions WHERE user_id = $2
                ) RETURNING *
                `,
                [id, user_id]
            );
        }

        if (!result || result.rows.length === 0) {
            return res.status(404).json({ message: "Feedback not found or unauthorized" });
        }
        res.status(200).json({ message: "Feedback deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};
