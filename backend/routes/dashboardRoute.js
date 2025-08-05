// backend/routes/dashboardRoute.js
const express = require("express");
const router = express.Router();
const oracledb = require("oracledb");
const dbConfig = require("../config/db"); // You can reuse your dbConfig

router.get("/summary", async (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
  
    try {
      const conn = await oracledb.getConnection(dbConfig);
      const userId = user.id;
  
      const [totalRooms, newListings, blogPosts, messages] = await Promise.all([
        conn.execute(`SELECT COUNT(*) FROM rooms WHERE user_id = :userId`, [userId]),
        conn.execute(`SELECT COUNT(*) FROM rooms WHERE user_id = :userId AND listed_date >= SYSDATE - 7`, [userId]),
        conn.execute(`SELECT COUNT(*) FROM blog_posts WHERE user_id = :userId`, [userId]),
        conn.execute(`SELECT COUNT(*) FROM messages WHERE user_id = :userId`, [userId])
      ]);
  
      await conn.close();
  
      res.json({
        success: true,
        data: {
          totalRooms: totalRooms.rows[0][0],
          newListings: newListings.rows[0][0],
          blogPosts: blogPosts.rows[0][0],
          messages: messages.rows[0][0]
        }
      });
    } catch (err) {
      console.error("❌ Dashboard summary error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });
  

module.exports = router;
