const express = require("express");
const router = express.Router();
const oracledb = require("oracledb");
const dbConfig = require("../config/db");

// ✅ GET /summary — Dashboard stats including global announcements count
router.get("/summary", async (req, res) => {
  const user = req.session.user;
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const conn = await oracledb.getConnection(dbConfig);
    const userId = user.id;

    // Fix: rooms have no user_id column, so no user filter on rooms queries
    const [
      totalRooms,
      newListings,
      blogPosts,
      messages,
      announcements
    ] = await Promise.all([
      conn.execute(`SELECT COUNT(*) FROM rooms`),  // all rooms count
      conn.execute(`SELECT COUNT(*) FROM rooms WHERE created_at >= SYSDATE - 7`), // recent rooms in last 7 days
      conn.execute(`SELECT COUNT(*) FROM blog_posts WHERE user_id = :userId`, [userId]),
      conn.execute(`SELECT COUNT(*) FROM messages WHERE user_id = :userId`, [userId]),
      conn.execute(`SELECT COUNT(*) FROM announcements`)  // global announcements count
    ]);

    await conn.close();

    res.json({
      success: true,
      data: {
        totalRooms: totalRooms.rows[0][0],
        newListings: newListings.rows[0][0],
        blogPosts: blogPosts.rows[0][0],
        messages: messages.rows[0][0],
        announcementCount: announcements.rows[0][0]
      }
    });
  } catch (err) {
    console.error("❌ Dashboard summary error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ GET /activity — Recent activity logs
router.get("/activity", async (req, res) => {
  const user = req.session.user;
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const conn = await oracledb.getConnection(dbConfig);
    const userId = user.id;

    const result = await conn.execute(
      `SELECT activity_date, activity_type, status, details
       FROM activities
       WHERE user_id = :userId
       ORDER BY activity_date DESC FETCH FIRST 10 ROWS ONLY`,
      [userId],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    await conn.close();

    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error("❌ Dashboard activity fetch error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
