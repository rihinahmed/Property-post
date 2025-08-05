const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const dbConfig = require('../config/db');

// Force CLOBs to be fetched as strings globally before connecting
oracledb.fetchAsString = [ oracledb.CLOB ];

router.get('/', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `SELECT id, title, content, posted_by, TO_CHAR(posted_at, 'YYYY-MM-DD HH24:MI') AS posted_at
       FROM announcements
       ORDER BY posted_at DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }  // Using object format for clarity
    );

    // Now content will be string, no LOB objects
    const announcements = result.rows.map(row => ({
      id: row.ID,
      title: row.TITLE,
      content: row.CONTENT,   // Now a string thanks to fetchAsString
      posted_by: row.POSTED_BY,
      posted_at: row.POSTED_AT
    }));

    res.json(announcements);

  } catch (err) {
    console.error('❌ Error fetching announcements:', err);
    res.status(500).json({ error: 'Error fetching announcements' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('❌ Error closing connection:', closeErr);
      }
    }
  }
});

module.exports = router;
