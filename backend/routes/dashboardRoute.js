// Updated routes/dashboardRoute.js - Removes auto-logging and sample data

const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const { logActivity, ACTIVITY_TYPES, STATUS_TYPES } = require('../utils/activityLogger');

const dbConfig = {
    user: "SYSTEM",
    password: "Rihin1234",
    connectString: "localhost/XEPDB1"
};

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
    }
}

/**
 * GET /api/dashboard/summary - Dashboard statistics
 * NO automatic logging - just returns data
 */
router.get('/summary', isAuthenticated, async (req, res) => {
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        const userId = req.session.user.id;
        
        // Get all dashboard statistics WITHOUT logging dashboard access
        const [
            totalRoomsResult,
            newListingsResult,
            blogPostsResult,
            savedRoomsResult,
            announcementResult
        ] = await Promise.all([
            conn.execute(`SELECT COUNT(*) AS COUNT FROM PROPERTIES`),
            conn.execute(`SELECT COUNT(*) AS COUNT FROM PROPERTIES WHERE CREATED_AT >= SYSDATE - 7`),
            conn.execute(`SELECT COUNT(*) AS COUNT FROM BLOG_POSTS`),
            conn.execute(`SELECT COUNT(*) AS COUNT FROM SAVED_ROOMS WHERE USER_ID = :userId`, { userId }),
            conn.execute(`SELECT COUNT(*) AS COUNT FROM ANNOUNCEMENTS`)
        ]);
        
        const summaryData = {
            totalRooms: totalRoomsResult.rows[0]?.COUNT || 0,
            newListings: newListingsResult.rows[0]?.COUNT || 0,
            blogPosts: blogPostsResult.rows[0]?.COUNT || 0,
            savedRooms: savedRoomsResult.rows[0]?.COUNT || 0,
            announcementCount: announcementResult.rows[0]?.COUNT || 0
        };
        
        console.log(`📊 Dashboard summary for user ${userId}:`, summaryData);
        
        res.json({
            success: true,
            data: summaryData
        });

    } catch (err) {
        console.error("❌ Dashboard summary error:", err);
        
        // Return safe defaults if there's an error
        res.json({ 
            success: false,
            message: 'Error loading dashboard data',
            data: {
                totalRooms: 0,
                newListings: 0,
                blogPosts: 0,
                savedRooms: 0,
                announcementCount: 0
            }
        });
    } finally {
        if (conn) {
            try { await conn.close(); } catch (err) { console.error(err); }
        }
    }
});

/**
 * GET /api/dashboard/activity - Recent activity log
 * Only shows actual trigger-fired activities, NO sample data creation
 */
router.get('/activity', isAuthenticated, async (req, res) => {
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        
        // Get recent activities - only real ones from triggers
        const result = await conn.execute(`
            SELECT 
                ACTIVITY_DATE, 
                ACTIVITY_TYPE, 
                STATUS, 
                DETAILS,
                USER_ID
            FROM ACTIVITY_LOG 
            ORDER BY ACTIVITY_DATE DESC 
            FETCH FIRST 15 ROWS ONLY
        `);
        
        const activities = result.rows || [];
        
        console.log(`📋 Loaded ${activities.length} real activities from triggers`);
        
        res.json({ 
            success: true, 
            data: activities 
        });

    } catch (err) {
        console.error("❌ Dashboard activity error:", err);
        
        // Return empty array if there's an error - no fallback sample data
        res.json({ 
            success: false,
            message: 'Error loading activities',
            data: []
        });
    } finally {
        if (conn) {
            try { await conn.close(); } catch (err) { console.error(err); }
        }
    }
});

/**
 * POST /api/dashboard/test-activity - Create a test activity (for testing only)
 * This is the ONLY manual way to create activities now
 */
router.post('/test-activity', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;
        await logActivity(userId, 'Manual Test', 'Success', 'Test activity created manually from dashboard');
        res.json({ success: true, message: 'Test activity created' });
    } catch (err) {
        console.error('Error creating test activity:', err);
        res.status(500).json({ success: false, message: 'Error creating test activity' });
    }
});

module.exports = router;