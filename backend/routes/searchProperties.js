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

module.exports = router;