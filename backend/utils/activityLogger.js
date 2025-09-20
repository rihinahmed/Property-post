// utils/activityLogger.js
const oracledb = require('oracledb');
const dbConfig = require('../config/db');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

async function logActivity(userId, title, message) {
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        await conn.execute(
            `INSERT INTO recent_activities (user_id, title, message)
             VALUES (:userId, :title, :message)`,
            { userId, title, message },
            { autoCommit: true }
        );
        console.log(`Activity logged for user ${userId}: ${title}`);
    } catch (err) {
        console.error("❌ Error logging activity:", err);
    } finally {
        if (conn) try { await conn.close(); } catch (err) { console.error(err); }
    }
}

module.exports = {
    logActivity
};