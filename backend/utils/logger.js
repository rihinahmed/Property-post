const oracledb = require("oracledb");
const dbConfig = require("../config/db");

async function logActivity(userId, type, status, details) {
  try {
    const conn = await oracledb.getConnection(dbConfig);
    await conn.execute(
      `INSERT INTO activities (user_id, activity_type, status, details)
       VALUES (:userId, :type, :status, :details)`,
      { userId, type, status, details },
      { autoCommit: true }
    );
    await conn.close();
  } catch (err) {
    console.error("❌ Failed to log activity:", err);
  }
}

module.exports = logActivity;
