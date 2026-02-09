//crud operations for counselors
import { pool } from "../config/connect_database.js";
import bcrypt from "bcrypt";

//get all counselors
export const getAllCounselors = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT counselor_id, username, specialties, is_active FROM counselors"
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error?.message });
    }
}

//add new counselor
export const addNewCounselor = async (req, res) => {
    const {
        username,
        password,
        specialties
    } = req.body;

    if(!username || !password || !specialties){
        return res.status(400).json({ message: "All fields are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        //check if user exits with the same username
        const existingUser = await pool.query(
            "SELECT * FROM counselors WHERE username = $1",
            [username]
        );
        if(existingUser.rows.length > 0){
            return res.status(400).json({ message: "Try another username" });
        }
        

        await pool.query(
            "INSERT INTO counselors (username, password_hash, specialties, is_active) VALUES ($1, $2, $3, $4) RETURNING *",
            [username, hashedPassword, specialties, "FALSE"]
        );
        
        res.json({message: `${username} added successfully.You can now login`});

    } catch (error) {
        console.error(error?.message);
        res.status(500).json({ message: error?.message });
    }
    

}

//update counselor
export const updateCounselor = async (req, res) => {
    const user = req.user;
    const { id } = req.params;
    const { username, password, specialties , newPassword} = req.body;

    if (!id) {
        return res.status(400).json({ message: "Counselor ID is required" });
    }

    try {
        //check if the counselor is the one updating or an admin
        if(user.roles === 'counselor' && user.counselor_id !== id){
            //counsellors can only update their own profiles
            return res.status(403).json({ message: "Access denied" });
        }
        // Check if counselor exists
        const existingUser = await pool.query(
            "SELECT * FROM counselors WHERE counselor_id = $1",
            [id]
        );

        if (existingUser.rows.length === 0) {
            return res.status(404).json({ message: "Counselor not found" });
        }

        const counselor = existingUser.rows[0];
        let hashedPassword = counselor.password_hash; // keep old password by default

        // If password change requested
        if (password && newPassword) {
            const isMatch = await bcrypt.compare(password, counselor.password_hash);
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
        if (specialties) {
            fields.push(`specialties = $${paramIndex++}`);
            values.push(specialties);
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
            `UPDATE counselors SET ${fields.join(", ")} WHERE counselor_id = $${paramIndex}`,
            values
        );

        res.status(200).json({ message: "User updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error?.message });
    }
};

export const getCounselor = async (req, res) => {
    const user = req.user;
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "Counselor ID is required" });
    }

    try {
        //check if the counselor is the one getting or an admin
        if(user.roles === 'counselor' && user.counselor_id !== id){
            //counsellors can only get their own profiles
            return res.status(403).json({ message: "Access denied" });
        }
        //check if counselor exits
        const existingCounselor = await pool.query(
            "SELECT * FROM counselors WHERE counselor_id = $1",
            [id]
        );
        if(existingCounselor.rows.length === 0){
            return res.status(404).json({ message: "Counselor not found" });
        }
        const result = await pool.query(
            "SELECT counselor_id, username, specialties, is_active FROM counselors WHERE counselor_id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Counselor not found" });
        }

         
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error?.message });
    }
};

//delete counselor
export const deleteCounselor = async (req, res) => {
    const user = req.user;
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "Counselor ID is required" });
    }

    try {
        //check if the counselor is the one deleting or an admin
        if(user.roles === 'counselor' && user.counselor_id !== id){
            //counsellors can only delete their own accounts
            return res.status(403).json({ message: "Access denied" });
        }
        //check if counselor exits
        const existingCounselor = await pool.query(
            "SELECT * FROM counselors WHERE counselor_id = $1",
            [id]
        );
        if(existingCounselor.rows.length === 0){
            return res.status(404).json({ message: "Counselor not found" });
        }
        const result = await pool.query(
            "DELETE FROM counselors WHERE counselor_id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Counselor not found" });
        }

        res.status(200).json({ message: "Counselor deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error?.message });
    }
};
    

