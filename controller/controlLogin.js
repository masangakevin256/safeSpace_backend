import { pool } from "../config/connect_database.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
export const controlUserLogin = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    try {
        const user = await pool.query(
            "SELECT * FROM users WHERE username = $1",
            [username]
        );

        if (user.rows.length === 0) {
            return res.status(401).json({ message: "Incorrect username" });
        }
        const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect password" });
        }
        //generate access token
        const accessToken = jwt.sign(
            {
                userInfo: {
                    user_id: user.rows[0].user_id,
                    username: user.rows[0].username,
                    roles: user.rows[0].role
                }
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "1d" }
        )
        //generate refresh token
        const refreshToken = jwt.sign(
            {
                userInfo: {
                    user_id: user.rows[0].user_id,
                    username: user.rows[0].username,
                    roles: user.rows[0].role
                }
            },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "7d" }
        )
        //update refresh token into db
        await pool.query(
            "UPDATE users SET refresh_token = $1 WHERE user_id = $2",
            [refreshToken, user.rows[0].user_id]
        )
        //set refresh token as httpOnly cookie
        res.cookie("jwt", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: 24 * 60 * 60 * 1000,
        });
        //update last_seen
        await pool.query(
            "UPDATE users SET last_seen = NOW() WHERE user_id = $1",
            [user.rows[0].user_id]
        );


        res.json({
            accessToken,
            user: {
                id: user.rows[0].user_id,
                username: user.rows[0].username,
                role: user.rows[0].role
            }
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error?.message });
    }

}

export const controlCounselorLogin = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    try {
        const counselor = await pool.query(
            "SELECT * FROM counselors WHERE username = $1",
            [username]
        );

        if (counselor.rows.length === 0) {
            return res.status(401).json({ message: "Incorrect username" });
        }
        const isMatch = await bcrypt.compare(password, counselor.rows[0].password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect password" });
        }
        //generate access token
        const accessToken = jwt.sign(
            {
                userInfo: {
                    counselor_id: counselor.rows[0].counselor_id,
                    username: counselor.rows[0].username,
                    roles: counselor.rows[0].role
                }
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "1d" }
        )
        //generate refresh token
        const refreshToken = jwt.sign(
            {
                userInfo: {
                    counselor_id: counselor.rows[0].counselor_id,
                    username: counselor.rows[0].username,
                    roles: counselor.rows[0].role
                }
            },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "7d" }
        )
        //update refresh token into db
        await pool.query(
            "UPDATE counselors SET refresh_token = $1 WHERE counselor_id = $2",
            [refreshToken, counselor.rows[0].counselor_id]
        )
        // console.log(refreshToken);
        //set refresh token as httpOnly cookie
        res.cookie("jwt", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: 24 * 60 * 60 * 1000,
        });
        //update is_active to true
        await pool.query(
            "UPDATE counselors SET is_active = true WHERE counselor_id = $1",
            [counselor.rows[0].counselor_id]
        );


        res.json({
            accessToken,
            user: {
                id: counselor.rows[0].counselor_id,
                username: counselor.rows[0].username,
                role: counselor.rows[0].role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error?.message });
    }

}
export const controlAdminLogin = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    try {
        const admin = await pool.query(
            "SELECT * FROM admins WHERE username = $1",
            [username]
        );

        if (admin.rows.length === 0) {
            return res.status(401).json({ message: "Incorrect username" });
        }
        const isMatch = await bcrypt.compare(password, admin.rows[0].password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect password" });
        }
        //generate access token
        const accessToken = jwt.sign(
            {
                userInfo: {
                    admin_id: admin.rows[0].admin_id,
                    username: admin.rows[0].username,
                    roles: admin.rows[0].role
                }
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "1d" }
        )
        //generate refresh token
        const refreshToken = jwt.sign(
            {
                userInfo: {
                    admin_id: admin.rows[0].admin_id,
                    username: admin.rows[0].username,
                    roles: admin.rows[0].role
                }
            },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "7d" }
        )
        //update refresh token into db
        await pool.query(
            "UPDATE admins SET refresh_token = $1 WHERE admin_id = $2",
            [refreshToken, admin.rows[0].admin_id]
        )
        //set refresh token as httpOnly cookie
        res.cookie("jwt", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: 24 * 60 * 60 * 1000,
        });
        //update last_login
        await pool.query(
            "UPDATE admins SET last_login = NOW() WHERE admin_id = $1",
            [admin.rows[0].admin_id]
        );


        res.json({
            accessToken,
            user: {
                id: admin.rows[0].admin_id,
                username: admin.rows[0].username,
                role: admin.rows[0].role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error?.message });
    }

}
