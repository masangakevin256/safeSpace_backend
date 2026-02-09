import { pool } from "../config/connect_database.js";
import bcrypt from "bcrypt";
//no email  for privacy
export const getAllUsers = async (req, res) => {
  try {
    const user = req.user;
    console.log(user ||  "No user");
    // Only select safe fields
    const result = await pool.query(
      "SELECT user_id, username, age_group, last_seen, pulse_level FROM users"
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error?.message });
  }
};


//add new user
export const addNewUser = async(req,res) => {
  
    const {
        username,
        email,
        password,
        age_group

    } = req.body;

    if(!username || !password || !age_group){
        return res.status(400).json({ message: "All fields are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        //check if user exits with the same username
        const existingUser = await pool.query(
            "SELECT * FROM users WHERE username = $1",
            [username]
        );
        if(existingUser.rows.length > 0){
            return res.status(400).json({ message: "Try another username" });
        }
        

        await pool.query(
            "INSERT INTO users (username, email, password_hash, age_group) VALUES ($1, $2, $3, $4) RETURNING *",
            [username, email, hashedPassword, age_group]
        );
        
        res.json({message: `${username} added successfully.You can now login`});

    } catch (error) {
        console.error(error?.message);
        res.status(500).json({ message: error?.message });
    }
    

}

export const updateUser = async (req, res) => {
  const requestedUser= req.user;
  const { id } = req.params;
  const { username, email, password, age_group, newPassword, pulse_level } = req.body;

  if (!id) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
   
    //check if the user is the one updating or an admin
    if(requestedUser.roles === 'user' && requestedUser.user_id !== id){
      //users can only update their own profiles
      return res.status(403).json({ message: "Access denied" });
    }
     //check if user exits
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE user_id = $1",
      [id]
    );
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = existingUser.rows[0];
    let hashedPassword = user.password_hash; // keep old password by default

    // If password change requested
    if (password && newPassword) {
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect current password" });
      }
      if (password === newPassword) {
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
    if (age_group) {
      fields.push(`age_group = $${paramIndex++}`);
      values.push(age_group);
    }
    if(pulse_level){
      fields.push(`pulse_level = $${paramIndex++}`);
      values.push(pulse_level);
    }
    if (newPassword) {
      fields.push(`password_hash = $${paramIndex++}`);
      values.push(hashedPassword);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "No fields provided to update" });
    }

    values.push(id);

    await pool.query(
      `UPDATE users SET ${fields.join(", ")} WHERE user_id = $${paramIndex}`,
      values
    );

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error?.message });
  }
};

export const getUser = async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    //check if user exits
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE user_id = $1",
      [id]
    );
    if(existingUser.rows.length === 0){
      return res.status(404).json({ message: "User not found" });
    }
    //check if the user is the one getting or an admin
    if(user.roles === 'user' && user.user_id !== id){
      //users can only get their own profiles
      return res.status(403).json({ message: "Access denied" });
    }
    const result = await pool.query(
      "SELECT user_id, username, age_group FROM users WHERE user_id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // i did not  return password or email for privacy
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error?.message });
  }
};

export const deleteUser = async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    //check if user exits
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE user_id = $1",
      [id]
    );
    if(existingUser.rows.length === 0){
      return res.status(404).json({ message: "User not found" });
    }
    //check if the user is the one deleting or an admin
    if(user.roles === 'user' && user.user_id !== id){
      //users can only delete their own accounts
      return res.status(403).json({ message: "Access denied" });
    }
   
    const result = await pool.query(
      "DELETE FROM users WHERE user_id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error?.message });
  }
};


