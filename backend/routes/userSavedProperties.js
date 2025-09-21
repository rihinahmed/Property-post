const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');

const dbConfig = {
  user: "SYSTEM",
  password: "Rihin1234",
  connectString: "localhost/XEPDB1"
};

oracledb.fetchAsString = [oracledb.CLOB];

// GET: Get all saved properties for a user (for saved.html page)
router.get("/user/:user_id", async (req, res) => {
  const userId = Number(req.params.user_id);
  let conn;

  try {
    conn = await oracledb.getConnection(dbConfig);

    const result = await conn.execute(
      `SELECT 
        pv.PROPERT_ID as id,
        pv.TITLE as title,
        pv.RENT as price,
        pv.DESCRIPTION as description,
        pv.IMAGES as images,
        pv.LOCATION as location,
        pv.SELLER_NAME as seller_name,
        pv.STATUS as status,
        sr.SAVED_AT as saved_at
       FROM property_view pv
       JOIN saved_rooms sr ON pv.PROPERT_ID = sr.room_id
       WHERE sr.user_id = :user_id
       ORDER BY sr.saved_at DESC`,
      { user_id: userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Process the results to format location and images
    const savedProperties = result.rows.map(room => {
      let locationText = 'Location not specified';
      if (room.LOCATION) {
        try {
          // Handle Oracle object type
          if (typeof room.LOCATION === 'object' && room.LOCATION.AREA && room.LOCATION.DISTRICT) {
            locationText = `${room.LOCATION.AREA}, ${room.LOCATION.DISTRICT}`;
          } else if (typeof room.LOCATION === 'string') {
            const locObj = JSON.parse(room.LOCATION);
            locationText = `${locObj.AREA || 'Unknown'}, ${locObj.DISTRICT || 'Unknown'}`;
          }
        } catch (e) {
          console.error('Location parsing error:', e);
        }
      }

      let imagesArray = [];
    if (room.IMAGES) {
      imagesArray = room.IMAGES.split(',').map(img => img.trim()); // trim to remove extra spaces
    }


      return {
        id: room.ID,
        title: room.TITLE || 'Untitled Property',
        price: room.PRICE || 0,
        description: room.DESCRIPTION || 'No description available',
        location: locationText,
        images: imagesArray,
        seller_name: room.SELLER_NAME || 'Unknown Seller',
        status: room.STATUS || 'unknown',
        saved_at: room.SAVED_AT
      };
    });

    res.json({
      success: true,
      savedProperties,
      count: savedProperties.length
    });

  } catch (err) {
    console.error("Get saved properties error:", err);
    res.status(500).json({ error: "Failed to fetch saved properties" });
  } finally {
    if (conn) await conn.close();
  }
});

// POST: Add a property to saved list
router.post("/add", async (req, res) => {
  const { room_id, user_id } = req.body;
  let conn;

  // Validate input
  if (!room_id || !user_id) {
    return res.status(400).json({ error: "room_id and user_id are required" });
  }

  try {
    conn = await oracledb.getConnection(dbConfig);
    
    // Start transaction
    await conn.execute('BEGIN NULL; END;');

    // Check if user is buyer
    const userCheck = await conn.execute(
      `SELECT role FROM users WHERE id = :user_id`,
      { user_id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    if (userCheck.rows[0].ROLE !== 'buyer') {
      return res.status(403).json({ error: "Only buyers can save properties" });
    }

    // Insert new saved room
    await conn.execute(
      `INSERT INTO saved_rooms (user_id, room_id, saved_at)
       VALUES (:user_id, :room_id, SYSDATE)`,
      { user_id, room_id },
      { autoCommit: false }
    );

    // Update saved_count in properties table
    await conn.execute(
      `UPDATE properties 
       SET saved_count = saved_count + 1 
       WHERE id = :room_id`,
      { room_id },
      { autoCommit: false }
    );

    // Commit transaction
    await conn.commit();

    res.status(201).json({
      message: "Property saved successfully",
      roomId: room_id,
      userId: user_id,
      isSaved: true
    });

  } catch (err) {
    // Rollback on error
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        console.error("Rollback error:", rollbackErr);
      }
    }

    console.error("Save property error:", err);
    
    // Check for specific Oracle errors
    if (err.errorNum === 1) {
      return res.status(409).json({ error: "Property already saved" });
    }
    
    if (err.errorNum === 2291) {
      return res.status(400).json({ error: "Invalid room_id or user_id" });
    }

    if (err.errorNum === 20001) {
      return res.status(403).json({ error: "Only buyers can save properties" });
    }
    
    res.status(500).json({ error: "Failed to save property" });
  } finally {
    if (conn) await conn.close();
  }
});

// DELETE: Remove property from saved list
router.delete("/remove/:room_id/:user_id", async (req, res) => {
  const roomId = Number(req.params.room_id);
  const userId = Number(req.params.user_id);
  let conn;

  try {
    conn = await oracledb.getConnection(dbConfig);
    
    // Start transaction
    await conn.execute('BEGIN NULL; END;');

    // Delete saved room
    const result = await conn.execute(
      `DELETE FROM saved_rooms
       WHERE user_id = :user_id AND room_id = :room_id`,
      { user_id: userId, room_id: roomId },
      { autoCommit: false }
    );

    if (result.rowsAffected === 0) {
      await conn.rollback();
      return res.status(404).json({ error: "Saved property not found" });
    }

    // Update saved_count in properties table
    await conn.execute(
      `UPDATE properties 
       SET saved_count = GREATEST(saved_count - 1, 0) 
       WHERE id = :room_id`,
      { room_id: roomId },
      { autoCommit: false }
    );

    // Commit transaction
    await conn.commit();

    res.json({
      message: "Property removed from saved list",
      roomId,
      userId,
      isSaved: false
    });

  } catch (err) {
    // Rollback on error
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        console.error("Rollback error:", rollbackErr);
      }
    }

    console.error("Remove saved property error:", err);
    res.status(500).json({ error: "Failed to remove saved property" });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;