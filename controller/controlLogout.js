import { pool } from "../config/connect_database.js";
import jwt from "jsonwebtoken";

export const handleLogout = async (req, res) => {
    // On client, also delete the accessToken
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204); // No content

    const refreshToken = cookies.jwt;

    try {
        // Find user by refresh token in all possible tables to clear it
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            async (err, decoded) => {
                // If token is invalid/expired, we still want to clear the cookie
                if (err) {
                    res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
                    return res.sendStatus(204);
                }

                const { user_id, counselor_id, admin_id, roles } = decoded.userInfo;
                let tableName;
                let idColumn;
                let idValue;

                if (roles === "user") {
                    tableName = "users";
                    idColumn = "user_id";
                    idValue = user_id;
                } else if (roles === "counselor") {
                    tableName = "counselors";
                    idColumn = "counselor_id";
                    idValue = counselor_id;
                } else if (roles === "admin") {
                    tableName = "admins";
                    idColumn = "admin_id";
                    idValue = admin_id;
                }

                if (tableName) {
                    // Delete refreshToken from DB
                    await pool.query(
                        `UPDATE ${tableName} SET refresh_token = NULL WHERE ${idColumn} = $1`,
                        [idValue]
                    );
                }

                res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
                res.sendStatus(204);
            }
        );
    } catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
