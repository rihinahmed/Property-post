const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const dbConfig = require('../config/db');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];

function isAuthenticatedSeller(req, res, next) {
    if (req.session.user && req.session.user.role.toLowerCase() === 'seller') {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized. Not a logged-in seller.' });
    }
}

router.use(isAuthenticatedSeller);

/**
 * GET dashboard summary data for the logged-in seller.
 */
router.get('/dashboard', async (req, res) => {
    const sellerId = req.session.user.id;
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        
        const propertyResult = await conn.execute(
            `SELECT
                COUNT(*) AS total_properties,
                SUM(CASE WHEN STATUS = 'active' THEN 1 ELSE 0 END) AS active_listings,
                SUM(VIEWS) AS total_views
             FROM PROPERTIES
             WHERE SELLER_ID = :sellerId`,
            [sellerId]
        );
        
        const summaryData = propertyResult.rows[0];

        const messageResult = await conn.execute(
            `SELECT COUNT(*) AS unread_messages
             FROM MESSAGES
             WHERE RECIPIENT_ID = :sellerId AND READ_STATUS = 'unread'`,
            [sellerId]
        );
        
        const unreadMessages = messageResult.rows[0]?.UNREAD_MESSAGES ?? 0;

        res.json({
            success: true,
            data: {
                totalProperties: summaryData?.TOTAL_PROPERTIES ?? 0,
                activeListings: summaryData?.ACTIVE_LISTINGS ?? 0,
                unreadMessages,
                totalViews: summaryData?.TOTAL_VIEWS ?? 0,
            },
        });
    } catch (err) {
        console.error("❌ Dashboard summary error:", err);
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    } finally {
        if (conn) {
            try {
                await conn.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
});

/**
 * GET recent activity for the logged-in seller.
 */
router.get('/activity', async (req, res) => {
    const sellerId = req.session.user.id;
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        
        const blogResult = await conn.execute(
            `SELECT ID, TITLE, CREATED_AT
             FROM BLOG_POSTS
             WHERE USER_ID = :sellerId
             ORDER BY CREATED_AT DESC
             FETCH FIRST 5 ROWS ONLY`,
            [sellerId]
        );

        const activities = blogResult.rows.map(row => ({
            title: `New Blog Post: ${row.TITLE}`,
            message: `Your blog post "${row.TITLE}" was published.`,
            timestamp: row.CREATED_AT,
        }));

        res.json({ success: true, data: activities });
    } catch (err) {
        console.error("❌ Recent activity error:", err);
        res.status(500).json({ success: false, message: "Server error.", error: err.message });
    } finally {
        if (conn) {
            try {
                await conn.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
});

module.exports = router;