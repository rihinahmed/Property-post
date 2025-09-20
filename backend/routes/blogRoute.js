// routes/blogRoutes.js

const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const dbConfig = require('../config/db');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
    }
}

/**
 * GET /api/blogs - Fetches all blog posts.
 */
router.get('/', async (req, res) => {
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        const result = await conn.execute(
            `SELECT ID, USER_ID, TITLE, CONTENT, CREATED_AT FROM BLOG_POSTS ORDER BY CREATED_AT DESC`
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error("❌ Blog fetch error:", err);
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    } finally {
        if (conn) try { await conn.close(); } catch (err) { console.error(err); }
    }
});

/**
 * POST /api/blogs - Creates a new blog post.
 * Requires user to be authenticated.
 */
router.post('/', isAuthenticated, async (req, res) => {
    const { title, content } = req.body;
    const userId = req.session.user.id;
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        // Using a sequence to generate the ID
        await conn.execute(
            `INSERT INTO BLOG_POSTS (ID, USER_ID, TITLE, CONTENT, CREATED_AT)
             VALUES (BLOG_POSTS_SEQ.NEXTVAL, :userId, :title, :content, SYSDATE)`,
            { userId, title, content }
        );
        res.status(201).json({ success: true, message: 'Blog post created successfully!' });
    } catch (err) {
        console.error("❌ Blog post creation error:", err);
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    } finally {
        if (conn) try { await conn.close(); } catch (err) { console.error(err); }
    }
});

module.exports = router;