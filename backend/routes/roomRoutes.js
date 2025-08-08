const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const dbConfig = require('../config/db');

// Optional: Convert CLOBs to strings
oracledb.fetchAsString = [ oracledb.CLOB ];

router.get("/:id", async (req, res) => {
  const roomId = parseInt(req.params.id);
  console.log("🔍 Requesting Room ID:", roomId);

  if (isNaN(roomId)) {
    return res.status(400).json({ success: false, message: "Invalid Room ID" });
  }

  try {
    const conn = await oracledb.getConnection(dbConfig);
    
    const result = await conn.execute(
      `SELECT room_id, title, location, rent, description, latitude, longitude, amenities, pros, cons, images
       FROM rooms
       WHERE room_id = :id`,
      [roomId],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log("🟢 SQL result:", result.rows);

    await conn.close();

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    const room = result.rows[0];

    res.json({
      success: true,
      room: {
        TITLE: room.TITLE,
        LOCATION: room.LOCATION,
        RENT: room.RENT,
        DESCRIPTION: room.DESCRIPTION,
        LATITUDE: room.LATITUDE,
        LONGITUDE: room.LONGITUDE,
        AMENITIES: (room.AMENITIES || '').split(","),
        PROS: (room.PROS || '').split(","),
        CONS: (room.CONS || '').split(","),
        IMAGES: (room.IMAGES || '').split(",")
      }
    });
  } catch (err) {
    console.error("❌ DB Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
