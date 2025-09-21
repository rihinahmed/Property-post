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

// GET all properties
router.get("/all", async (req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);

    const result = await conn.execute(
      `SELECT 
         id, 
         title, 
         rent, 
         location, 
         description, 
         created_at, 
         status,
         REGEXP_SUBSTR(images, '[^,]+', 1, 1) AS first_image
       FROM properties`
    );

    const properties = result.rows.map(row => ({
      id: row.ID,
      title: row.TITLE,
      rent: row.RENT,
      location: row.LOCATION,
      description: row.DESCRIPTION,
      date: row.CREATED_AT,
      status: row.STATUS,
      img: row.FIRST_IMAGE // directly get first image from query
    }));

    res.json(properties);
  } catch (err) {
    console.error("Fetch properties error:", err);
    res.status(500).json({ error: "Failed to fetch properties" });
  } finally {
    if (conn) await conn.close();
  }
});


router.post("/view/:propertyId", async (req, res) => {
  const propertyId = Number(req.params.propertyId);
  let conn;

  try {
    conn = await oracledb.getConnection(dbConfig);

    // Update view count
    const result = await conn.execute(
      `UPDATE properties 
       SET views = (select views FROM properties where id = :propertyId) + 1
       WHERE id = :propertyId`,
      { propertyId },
      { autoCommit: true, outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Get the updated view count
    const viewResult = await conn.execute(
      `SELECT views FROM properties WHERE id = :propertyId`,
      { propertyId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const newViewCount = viewResult.rows[0]?.VIEW_COUNT || 0;

    res.json({
      success: true,
      message: "View count updated",
      propertyId,
      viewCount: newViewCount
    });

  } catch (err) {
    console.error("Update view count error:", err);
    res.status(500).json({ error: "Failed to update view count" });
  } finally {
    if (conn) await conn.close();
  }
});




module.exports = router;