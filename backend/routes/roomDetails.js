// routes/propertiesRoute.js

const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');

const dbConfig = {
  user: "SYSTEM",
  password: "Rihin1234",
  connectString: "localhost/XEPDB1"
};

oracledb.fetchAsString = [oracledb.CLOB]; // make CLOB fetch as string





// saved property
router.get("/saved/:room_id/:user_id", async (req, res) => {
  const roomId = Number(req.params.room_id);
  const userId = Number(req.params.user_id);
  let conn;

  try {
    conn = await oracledb.getConnection(dbConfig);

    const result = await conn.execute(
      `SELECT COUNT(*) AS saved_count
       FROM saved_rooms
       WHERE room_id = :room_id AND user_id = :user_id`,
      { room_id: roomId, user_id: userId },
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


module.exports = router;



// GET property by ID from the view
router.get("/:id", async (req, res) => {
  const propertyId = req.params.id; // get ID from URL
  let conn;

  try {
    conn = await oracledb.getConnection(dbConfig);

    const result = await conn.execute(
      `SELECT 
         propert_id,
         seller_id,
         seller_name,
         seller_address,
         seller_phone,
         title,
         rent,
         description,
         amenities,
         pros,
         cons,
         images,
         location,
         created_at,
         status,
         saved_count,
         views
       FROM property_view
       WHERE propert_id = :id`,
      [propertyId],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    const row = result.rows[0];

    // If images are stored as comma-separated, extract first image
    const imagesArray = row.IMAGES ? row.IMAGES.split(',') : [];

    const property = {
      id: row.PROPERT_ID,
      seller: {
        id: row.SELLER_ID,
        name: row.SELLER_NAME,
        address: row.SELLER_ADDRESS,
        phone: row.SELLER_PHONE
      },
      title: row.TITLE,
      rent: row.RENT,
      description: row.DESCRIPTION,
      amenities: row.AMENITIES ? row.AMENITIES.split(',') : [],
      pros: row.PROS ? row.PROS.split(',') : [],
      cons: row.CONS ? row.CONS.split(',') : [],
      images: imagesArray,
      firstImage: imagesArray[0] || null,
      location: row.LOCATION,
      date: row.CREATED_AT,
      status: row.STATUS,
      savedCount: row.SAVED_COUNT,
      views: row.VIEWS
    };

    res.json(property);

  } catch (err) {
    console.error("Fetch property by ID error:", err);
    res.status(500).json({ error: "Failed to fetch property" });
  } finally {
    if (conn) await conn.close();
  }
});







module.exports = router;