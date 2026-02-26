import { pool } from "../config/connect_database.js";

// --------------------- USER STATS ---------------------
export const getUserStats = async (req, res) => {
  const user = req.user;
  const user_id = user.user_id;
  // console.log("User ID:", user_id);

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(user_id)) {
    return res.status(400).json({ message: "Invalid user ID format" });
  }

  try {
    // 1. Total Sessions (completed or active) - with explicit cast
    const sessionsRes = await pool.query(
      `SELECT COUNT(*) FROM sessions WHERE user_id = $1::uuid`,
      [user_id]
    );
    const totalSessions = parseInt(sessionsRes.rows[0].count, 10);

    // 2. Unread Messages (proxy for now, no read/unread flag)
    const unreadRes = await pool.query(
      `SELECT COUNT(*) 
       FROM messages m
       JOIN sessions s ON m.session_id = s.session_id
       WHERE s.user_id = $1::uuid AND m.sender = s.counselor_id::varchar`,
      [user_id]
    );
    const unreadMessages = parseInt(unreadRes.rows[0].count, 10);

    // 3. Journal Entries / Check-ins
    const checkinsRes = await pool.query(
      `SELECT COUNT(*) as total, AVG(mood) as avg_mood 
       FROM checkins 
       WHERE user_id = $1::uuid`,
      [user_id]
    );
    const journalEntries = parseInt(checkinsRes.rows[0].total, 10);

    let avgMood = "No Data";
    const moodVal = parseFloat(checkinsRes.rows[0].avg_mood || 0);
    if (moodVal >= 4) avgMood = "Good";
    else if (moodVal >= 2.5) avgMood = "Fair";
    else if (moodVal > 0) avgMood = "Poor";

    // 4. Next Session (placeholder)
    let nextSession = "None";
    let nextSessionTime = "N/A";

    res.status(200).json({
      moodAverage: { value: avgMood, trend: { value: "N/A", isUp: true }, subtitle: "Overall" },
      totalSessions: { value: totalSessions.toString(), subtitle: "All time" },
      unreadMessages: { value: unreadMessages.toString(), subtitle: "From counselors" },
      journalEntries: { value: journalEntries.toString(), subtitle: "All time" },
      nextSession: { value: nextSession, subtitle: nextSessionTime },
      wellnessScore: { value: "N/A", trend: { value: "N/A", isUp: true }, subtitle: "Pending data" }
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// --------------------- COUNSELOR STATS ---------------------
export const getCounselorStats = async (req, res) => {
  const { user_id } = req.user;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(user_id)) {
    return res.status(400).json({ message: "Invalid user ID format" });
  }

  try {
    const activeSessionsRes = await pool.query(
      `SELECT COUNT(*) FROM sessions WHERE counselor_id = $1::uuid AND status = 'active'`,
      [user_id]
    );
    const activeSessions = parseInt(activeSessionsRes.rows[0].count, 10);

    const pendingSessionsRes = await pool.query(
      `SELECT COUNT(*) FROM sessions WHERE counselor_id = $1::uuid AND status = 'pending'`,
      [user_id]
    );
    const waitingList = parseInt(pendingSessionsRes.rows[0].count, 10);

    const distinctClientsRes = await pool.query(
      `SELECT COUNT(DISTINCT user_id) FROM sessions WHERE counselor_id = $1::uuid`,
      [user_id]
    );
    const totalClients = parseInt(distinctClientsRes.rows[0].count, 10);

    res.status(200).json({
      activeSessions: { value: activeSessions.toString(), subtitle: "Currently ongoing" },
      waitingList: { value: waitingList.toString(), subtitle: "Awaiting assignment" },
      unreadMessages: { value: "0", subtitle: "From clients" },
      totalClients: { value: totalClients.toString(), subtitle: "Unique clients" },
      todaysSchedule: { value: activeSessions.toString(), subtitle: "Sessions today" },
      sessionRating: { value: "N/A", trend: { value: "N/A", isUp: true }, subtitle: "Average rating" }
    });
  } catch (error) {
    console.error("Error fetching counselor stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// --------------------- ADMIN STATS ---------------------
export const getAdminStats = async (req, res) => {
  try {
    const userCountRes = await pool.query(`SELECT COUNT(*) FROM users`);
    const counselorCountRes = await pool.query(`SELECT COUNT(*) FROM counselors`);
    const sessionsRes = await pool.query(`SELECT COUNT(*) FROM sessions WHERE status = 'active'`);
    const completedSessionsRes = await pool.query(`SELECT COUNT(*) FROM sessions WHERE status = 'completed'`);

    res.status(200).json({
      totalUsers: { value: parseInt(userCountRes.rows[0].count, 10).toString(), trend: { value: '', isUp: true }, subtitle: "Registered users" },
      counselors: { value: parseInt(counselorCountRes.rows[0].count, 10).toString(), trend: { value: '', isUp: true }, subtitle: "Active professionals" },
      activeSessions: { value: parseInt(sessionsRes.rows[0].count, 10).toString(), subtitle: "Currently ongoing" },
      systemHealth: { value: "100%", subtitle: "Uptime this month" },
      newUsers: { value: parseInt(userCountRes.rows[0].count, 10).toString(), trend: { value: '', isUp: true }, subtitle: "Total records" },
      sessionsCompleted: { value: parseInt(completedSessionsRes.rows[0].count, 10).toString(), subtitle: "All time" },
      avgResponse: { value: "N/A", trend: { value: '', isUp: true }, subtitle: "Response time" },
      satisfaction: { value: "N/A", trend: { value: '', isUp: true }, subtitle: "Average rating" }
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};