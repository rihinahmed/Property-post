const oracledb = require("oracledb");
const dbConfig = require("../config/db");

async function getSellerProperties(req, res) {
  const sellerId = req.session.user.id;  // Assumes session stores user id & role
  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `SELECT property_id, title, image_url, location, status, views, saved_count, price
       FROM properties
       WHERE seller_id = :sellerId`,
      { sellerId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json({ success: true, properties: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch properties" });
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = { getSellerProperties };
