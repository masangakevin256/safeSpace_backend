import { pool } from "../config/connect_database.js";
import jwt from "jsonwebtoken";

export const handleRefreshToken = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(401);

    const refreshToken = cookies.jwt;

    try {
        // Find user by refresh token in all possible tables
        // In a real high-scale app, we might store roles in the token to avoid searching all tables
        // but here we can check them sequentially or decoded first

        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            async (err, decoded) => {
                if (err) return res.sendStatus(403); // Forbidden if token is invalid or expired

                const { user_id, counselor_id, admin_id, roles } = decoded.userInfo;
                let foundUser;
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
                } else {
                    return res.sendStatus(403);
                }

                const result = await pool.query(
                    `SELECT * FROM ${tableName} WHERE ${idColumn} = $1 AND refresh_token = $2`,
                    [idValue, refreshToken]
                );

                if (result.rows.length === 0) return res.sendStatus(403);

                foundUser = result.rows[0];

                // Create new access token
                const accessToken = jwt.sign(
                    {
                        userInfo: {
                            [idColumn]: idValue,
                            username: foundUser.username,
                            roles: roles
                        }
                    },
                    process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: "15m" }
                );

                res.json({ accessToken });
            }
        );
    } catch (error) {
        console.error("Refresh Token Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
