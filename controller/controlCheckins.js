//check_ins controller
import { pool } from "../config/connect_database.js";
import { createSafetyFlag } from "./controlSafetyFlags.js";

// Helper function to get recent moods
async function getRecentMoods(user_id, days = 7) {
  const res = await pool.query(
    `SELECT mood FROM checkins WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '${days} days' ORDER BY created_at DESC`,
    [user_id]
  );
  return res.rows.map(r => r.mood);
}

// Helper function to calculate average mood
function average(arr) {
  if (!arr.length) return null;
  const sum = arr.reduce((a, b) => a + b, 0);
  return sum / arr.length;
}

// Main check-in controller
export async function createCheckin(req, res) {
  try {
    const { mood, note } = req.body;
    const user = req.user;
    const user_id = user.user_id;

    if (!user_id || mood == null) {
      return res.status(400).json({ error: "user_id and mood are required" });
    }

    //  Save the check-in
    const insertQuery = `
      INSERT INTO checkins (user_id, mood, note)
      VALUES ($1, $2, $3)
      RETURNING checkin_id, created_at
    `;
    const insertRes = await pool.query(insertQuery, [user_id, mood, note || ""]);

    //  Retrieve recent moods
    const recentMoods = await getRecentMoods(user_id, 7);
    const avgMood = average(recentMoods);
    const lowMoodCount = recentMoods.filter(m => m <= 2).length;

    let newPulse = Math.round(avgMood);
    newPulse = Math.max(1, Math.min(newPulse, 5)); // always between 1 and 5

    await pool.query(`UPDATE users SET pulse_level = $1 WHERE user_id = $2`, [newPulse, user_id]);

    // Auto-trigger safety flags
    if (mood <= 1 || lowMoodCount >= 2) {
      await createSafetyFlag({
        user_id,
        type: "suicidal_risk",
        source: "checkin_signal",
        mood,
        note,
      });
    }

    return res.status(201).json({
      message: "Check-in created successfully",
      checkin: insertRes.rows[0],
      pulse: newPulse,
    });
  } catch (err) {
    console.error("Error creating check-in:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Controller to fetch user check-ins
export async function getMyCheckins(req, res) {
  try {
    const user_id = req.user.user_id;

    const checkinsRes = await pool.query(
      `SELECT checkin_id, mood, note, created_at FROM checkins WHERE user_id = $1 ORDER BY created_at DESC`,
      [user_id]
    );

    return res.status(200).json({ checkins: checkinsRes.rows });
  } catch (err) {
    console.error("Error fetching check-ins:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Admin / counselor endpoint to get any user's check-ins
export async function getUserCheckins(req, res) {
  try {
    const { id } = req.params; // user id
    const checkinsRes = await pool.query(
      `SELECT checkin_id, mood, note, created_at FROM checkins WHERE user_id = $1 ORDER BY created_at DESC`,
      [id]
    );

    return res.status(200).json({ checkins: checkinsRes.rows });
  } catch (err) {
    console.error("Error fetching user check-ins:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

