// routes/analyticsRoute.js

const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const dbConfig = require('../config/db');

// Configure Oracle DB for the router
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;

/**
 * @api {get} /api/analytics/:id Get seller analytics
 * @apiDescription Fetches key analytics data for a given seller, including stats and charts.
 * @apiParam {Number} id The ID of the seller to fetch analytics for.
 */
router.get("/:id", async (req, res) => {
    console.log("🔍 [GET /api/analytics/:id] Request received.");
    const sellerId = parseInt(req.params.id, 10);
    
    if (isNaN(sellerId)) {
        return res.status(400).json({ success: false, message: "Invalid seller ID." });
    }

    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        console.log("🟢 [GET /api/analytics/:id] Database connection established.");

        // Fetch Total Properties
        const totalPropertiesResult = await conn.execute(
            `SELECT COUNT(*) AS total FROM properties WHERE seller_id = :sellerId`,
            { sellerId }
        );
        const totalProperties = totalPropertiesResult.rows[0].TOTAL;

        // Fetch Active Listings
        const activeListingsResult = await conn.execute(
            `SELECT COUNT(*) AS active FROM properties WHERE seller_id = :sellerId AND status = 'active'`,
            { sellerId }
        );
        const activeListings = activeListingsResult.rows[0].ACTIVE;

        // Fetch Monthly Views (sum of all views for properties owned by seller)
        // Note: Assumes 'views' is a column in the properties table
        const totalViewsResult = await conn.execute(
            `SELECT SUM(views) AS totalViews FROM properties WHERE seller_id = :sellerId`,
            { sellerId }
        );
        const totalMonthlyViews = totalViewsResult.rows[0].TOTALVIEWS || 0;

        // Fetch New Messages (last 30 days)
        const newMessagesResult = await conn.execute(
            `SELECT COUNT(*) AS newMessages FROM messages WHERE RECIPIENT_ID = :sellerId AND SENT_AT >= SYSDATE - 30`,
            { sellerId }
        );
        const newMessages = newMessagesResult.rows[0].NEWMESSAGES;

        // Fetch data for the charts (last 6 months)
        // Assumes a 'views' column and 'created_at' in properties table
        const chartDataQuery = `
            SELECT
                TO_CHAR(created_at, 'Mon') as month,
                SUM(views) as views_count,
                COUNT(*) as listings_count
            FROM
                properties
            WHERE
                seller_id = :sellerId
                AND created_at >= ADD_MONTHS(SYSDATE, -6)
            GROUP BY
                TO_CHAR(created_at, 'Mon'),
                TO_CHAR(created_at, 'YYYYMM')
            ORDER BY
                TO_CHAR(created_at, 'YYYYMM')
        `;

        const chartDataResult = await conn.execute(chartDataQuery, { sellerId });

        const chartLabels = chartDataResult.rows.map(row => row.MONTH);
        const viewsData = chartDataResult.rows.map(row => row.VIEWS_COUNT);
        const listingsData = chartDataResult.rows.map(row => row.LISTINGS_COUNT);

        const analyticsData = {
            totalProperties,
            activeListings,
            totalMonthlyViews,
            newMessages,
            viewsChart: {
                labels: chartLabels,
                data: viewsData
            },
            listingsChart: {
                labels: chartLabels,
                data: listingsData
            }
        };

        console.log("🟢 [GET /api/analytics/:id] Analytics data fetched successfully.");
        res.status(200).json({ success: true, data: analyticsData });

    } catch (err) {
        console.error("❌ [GET /api/analytics/:id] DB Error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    } finally {
        if (conn) {
            try { await conn.close(); } catch (err) { console.error(err); }
        }
    }
});

module.exports = router;
