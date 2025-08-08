const express = require("express");
const router = express.Router();
const oracledb = require("oracledb");
const dbConfig = require("../config/db");

// Middleware to check if user is logged in and is a seller
function ensureSeller(req, res, next) {
  if (req.session.user && req.session.user.role === "seller") {
    return next();
  } else {
    return res.status(403).json({ success: false, message: "Access denied. Seller only." });
  }
}

// Route: GET seller dashboard data
router.get("/data", ensureSeller, async (req, res) => {
  let connection;
  const sellerId = req.session.user.id;

  try {
    connection = await oracledb.getConnection(dbConfig);

    // Example 1: Fetch all properties posted by this seller
    const propertiesResult = await connection.execute(
      `SELECT * FROM rooms WHERE seller_id = :sellerId`,
      { sellerId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Example 2: Count total views for seller's properties
    const viewsResult = await connection.execute(
      `SELECT SUM(view_count) AS total_views FROM rooms WHERE seller_id = :sellerId`,
      { sellerId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Example 3: Count saved rooms by users (optional)
    const savedResult = await connection.execute(
      `SELECT COUNT(*) AS total_saved FROM saved_rooms WHERE room_id IN (SELECT id FROM rooms WHERE seller_id = :sellerId)`,
      { sellerId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json({
      success: true,
      properties: propertiesResult.rows,
      totalViews: viewsResult.rows[0]?.TOTAL_VIEWS || 0,
      totalSaved: savedResult.rows[0]?.TOTAL_SAVED || 0
    });

  } catch (err) {
    console.error("❌ Error fetching seller dashboard data:", err);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    if (connection) await connection.close();
  }
});

module.exports = router;
