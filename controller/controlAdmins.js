//controller for admins
import { pool } from "../config/connect_database.js";
import bcrypt from "bcrypt";

//get all admins
export const getAllAdmins = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT admin_id, username, email, is_active,last_login FROM admins"
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error?.message });
    }
}

//add new admin
export const addNewAdmin = async (req, res) => {
    const {
        username,
        password,
        email,
        registration_code
    } = req.body;

    if(!username || !password || !email || !registration_code){
        return res.status(400).json({ message: "All fields are required" });
    }

    if(registration_code !== process.env.SECRET_REG_CODE){
        return res.status(400).json({ message: "Invalid registration code" });
    }
    //only 5 admins int the system
    const existingAdmins = await pool.query(
        "SELECT * FROM admins"
    );
    if(existingAdmins.rows.length >= 5){
        return res.status(400).json({ message: "Maximum number of admins reached" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        //check if user exits with the same username
        const existingUser = await pool.query(
            "SELECT * FROM admins WHERE username = $1",
            [username]
        );
        if(existingUser.rows.length > 0){
            return res.status(400).json({ message: "Try another username" });
        }
        

        await pool.query(
            "INSERT INTO admins (username, password_hash, email) VALUES ($1, $2, $3) RETURNING *",
            [username, hashedPassword, email]
        );
        
        res.json({message: `${username} added successfully.You can now login`});

    } catch (error) {
        console.error(error?.message);
        res.status(500).json({ message: error?.message });
    }

    //send code to admin email to verify the email
}

//update admin
export const updateAdmin = async (req, res) => {
    const { id } = req.params;
    const { username, password, email , newPassword} = req.body;

    if (!id) {
        return res.status(400).json({ message: "Admin ID is required" });
    }

    try {
        // Check if admin exists
        const existingUser = await pool.query(
            "SELECT * FROM admins WHERE admin_id = $1",
            [id]
        );

        if (existingUser.rows.length === 0) {
            return res.status(404).json({ message: "Admin not found" });
        }

        const user = existingUser.rows[0];
        let hashedPassword = user.password_hash; // keep old password by default

        // If password change requested
        if (password && newPassword) {
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(400).json({ message: "Incorrect current password" });
            }
            if(password === newPassword){
                return res.status(400).json({ message: "New password cannot be the same as the current password" });
            }
            hashedPassword = await bcrypt.hash(newPassword, 10);
        }

        // Build dynamic update fields
        const fields = [];
        const values = [];
        let paramIndex = 1;

        if (username) {
            fields.push(`username = $${paramIndex++}`);
            values.push(username);
        }
        if (email) {
            fields.push(`email = $${paramIndex++}`);
            values.push(email);
        }
       if(newPassword){
        fields.push(`password_hash = $${paramIndex++}`);
        values.push(hashedPassword);
       }

        if (fields.length === 0) {
            return res.status(400).json({ message: "No fields provided to update" });
        }

        values.push(id);

        await pool.query(
            `UPDATE admins SET ${fields.join(", ")} WHERE admin_id = $${paramIndex}`,
            values
        );

        res.status(200).json({ message: "Admin updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error?.message });
    }
};

export const getAdmin = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "Admin ID is required" });
    }

    try {
        const result = await pool.query(
            "SELECT admin_id, username, email FROM admins WHERE admin_id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Admin not found" });
        }

         
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error?.message });
    }
};

//delete admin
export const deleteAdmin = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "Admin ID is required" });
    }

    try {
        const result = await pool.query(
            "DELETE FROM admins WHERE admin_id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Admin not found" });
        }

        res.status(200).json({ message: "Admin deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error?.message });
    }
};
