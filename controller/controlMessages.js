import { pool } from "../config/connect_database.js";
import { addNotification } from "./controlNotification.js";
import { getIO } from "../utils/socket.js";

export const sendMessage = async (req, res) => {
    const { session_id } = req.params;
    const { content } = req.body;
    const user = req.user;

    if (!content || content.trim() === "") {
        return res.status(400).json({ message: "Message content required" });
    }

    try {
        //  Load session
        const sessionResult = await pool.query(
            "SELECT * FROM sessions WHERE session_id = $1",
            [session_id]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({ message: "Session not found" });
        }

        const session = sessionResult.rows[0];

        // State check
        if (session.status !== "active") {
            return res.status(403).json({ message: "Session is not active" });
        }

        // Permission check
        if (
            (user.roles === "user" && session.user_id !== user.user_id) ||
            (user.roles === "counselor" && session.counselor_id !== user.counselor_id)
        ) {
            return res.status(403).json({ message: "Access denied" });
        }

        // Resolve sender
        const sender = user.roles; // 'user' or 'counselor'

        // Save message
        const msgResult = await pool.query(
            `
            INSERT INTO messages (session_id, sender, content, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING message_id AS id, *;
            `,
            [session_id, sender, content]
        );

        const message = msgResult.rows[0];

        // Notifications
        const recipient_id =
            sender === "user" ? session.counselor_id : session.user_id;
        const recipient_role =
            sender === "user" ? "counselor" : "user";

        await addNotification(
            user.user_id,
            user.roles,
            recipient_id,
            recipient_role,
            "message_received",
            "New Message",
            "You have received a new message"
        );

        // Socket.io
        try {
            const io = getIO();
            io.to(session_id).emit("receive_message", message);
        } catch (socketError) {
            console.error("Socket emission failed:", socketError);
        }

        return res.status(201).json(message);

    } catch (error) {
        console.error("sendMessage error:", error);
        res.status(500).json({ message: "Failed to send message" });
    }
};

export const getMessages = async (req, res) => {
    const { session_id } = req.params;
    const user = req.user;

    try {
        const sessionResult = await pool.query(
            "SELECT * FROM sessions WHERE session_id = $1",
            [session_id]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({ message: "Session not found" });
        }

        const session = sessionResult.rows[0];

        if (session.status !== "active") {
            return res.status(403).json({ message: "Session is not active" });
        }

        if (
            (user.roles === "user" && session.user_id !== user.user_id) ||
            (user.roles === "counselor" && session.counselor_id !== user.counselor_id)
        ) {
            return res.status(403).json({ message: "Access denied" });
        }

        const messagesResult = await pool.query(
            "SELECT message_id AS id, * FROM messages WHERE session_id = $1 ORDER BY created_at ASC",
            [session_id]
        );

        const messages = messagesResult.rows;

        return res.status(200).json(messages);

    } catch (error) {
        console.error("getMessages error:", error);
        res.status(500).json({ message: "Failed to get messages" });
    }
}
//delete message
export const deleteMessage = async (req, res) => {
    const { message_id } = req.params;
    const user = req.user;

    try {
        // Load message
        const messageResult = await pool.query(
            "SELECT * FROM messages WHERE message_id = $1",
            [message_id]
        );

        if (messageResult.rows.length === 0) {
            return res.status(404).json({ message: "Message not found" });
        }

        const message = messageResult.rows[0];

        // Load session
        const sessionResult = await pool.query(
            "SELECT * FROM sessions WHERE session_id = $1",
            [message.session_id]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({ message: "Session not found" });
        }

        const session = sessionResult.rows[0];
        // Authorization check
        let allowed = false;

        if (
            user.roles === "user" &&
            message.sender === "user" &&
            session.user_id === user.user_id
        ) {
            allowed = true;
        }

        if (
            user.roles === "counselor" &&
            message.sender === "counselor" &&
            session.counselor_id === user.user_id
        ) {
            allowed = true;
        }

        if (!allowed) {
            return res.status(403).json({ message: "Access denied" });
        }

        // 4. Delete
        await pool.query(
            "DELETE FROM messages WHERE message_id = $1",
            [message_id]
        );

        return res.status(200).json({ message: "Message deleted" });

    } catch (error) {
        console.error("deleteMessage error:", error);
        res.status(500).json({ message: "Failed to delete message" });
    }
};


