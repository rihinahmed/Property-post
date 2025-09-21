const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');

const dbConfig = {
  user: "SYSTEM",
  password: "Rihin1234",
  connectString: "localhost/XEPDB1"
};

oracledb.fetchAsString = [oracledb.CLOB];

// GET: Check if room is saved by user
router.get("/:room_id/:user_id", async (req, res) => {
  const roomId = Number(req.params.room_id);
  const userId = Number(req.params.user_id);
  let conn;

  try {
    conn = await oracledb.getConnection(dbConfig);

    const result = await conn.execute(
      `SELECT COUNT(*) AS saved_count
       FROM saved_rooms
       WHERE user_id = :user_id AND room_id = :room_id`,
      { user_id: userId, room_id: roomId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const savedCount = result.rows[0].SAVED_COUNT;

    res.json({
      roomId,
      userId,
      isSaved: savedCount > 0
    });

  } catch (err) {
    console.error("Fetch saved status error:", err);
    res.status(500).json({ error: "Failed to check saved status" });
  } finally {
    if (conn) await conn.close();
  }
});

// POST: Save a room for user
router.post("/", async (req, res) => {
  const { room_id, user_id } = req.body;
  let conn;

  // Validate input
  if (!room_id || !user_id) {
    return res.status(400).json({ error: "room_id and user_id are required" });
  }

  try {
    conn = await oracledb.getConnection(dbConfig);

    // Insert new saved room (will fail if already exists due to primary key constraint)
    const result = await conn.execute(
      `INSERT INTO saved_rooms (user_id, room_id, saved_at)
       VALUES (:user_id, :room_id, SYSDATE)`,
      { user_id, room_id },
      { autoCommit: true }
    );

    res.status(201).json({
      message: "Room saved successfully",
      roomId: room_id,
      userId: user_id,
      isSaved: true
    });

  } catch (err) {
    console.error("Save room error:", err);
    
    // Check if it's a duplicate key error (ORA-00001)
    if (err.errorNum === 1) {
      return res.status(409).json({ error: "Room already saved" });
    }
    
    // Check if it's a foreign key constraint error
    if (err.errorNum === 2291) {
      return res.status(400).json({ error: "Invalid room_id or user_id" });
    }
    
    res.status(500).json({ error: "Failed to save room" });
  } finally {
    if (conn) await conn.close();
  }
});

// DELETE: Remove saved room
router.delete("/:room_id/:user_id", async (req, res) => {
  const roomId = Number(req.params.room_id);
  const userId = Number(req.params.user_id);
  let conn;

  try {
    conn = await oracledb.getConnection(dbConfig);

    const result = await conn.execute(
      `DELETE FROM saved_rooms
       WHERE user_id = :user_id AND room_id = :room_id`,
      { user_id: userId, room_id: roomId },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Saved room not found" });
    }

    res.json({
      message: "Room removed from saved list",
      roomId,
      userId,
      isSaved: false
    });

  } catch (err) {
    console.error("Remove saved room error:", err);
    res.status(500).json({ error: "Failed to remove saved room" });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;