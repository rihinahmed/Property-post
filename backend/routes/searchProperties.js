// routes/propertiesRoute.js

const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');


// DB Config (import if needed, or pass via require)
const dbConfig = {
  user: "SYSTEM",
  password: "Rihin1234",
  connectString: "localhost/XEPDB1"
};

// GET all properties
router.get("/all", async (req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);

    const result = await conn.execute(
      `SELECT id, title, rent, location, description, CREATED_AT FROM properties`
    );

    const properties = result.rows.map(row => ({
      //id: row.ID,
      title: row.TITLE,
      rent: row.RENT,
      location: row.LOCATION,
      description: row.DESCRIPTION,
      date: row.CREATED_AT
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