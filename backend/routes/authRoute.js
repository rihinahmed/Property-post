// backend/routes/authRoute.js
const express = require('express');
const oracledb = require('oracledb');
const dbConfig = require('../config/db');

const router = express.Router();

// A hypothetical login endpoint that returns a user's ID
router.post('/login', async (req, res) => {
    let connection;
    try {
        const { email } = req.body;
        connection = await oracledb.getConnection(dbConfig);

        const result = await connection.execute(
            `SELECT ID, FULL_NAME FROM USERS WHERE EMAIL = :email`,
            { email: email },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            res.status(200).json({
                success: true,
                message: 'Login successful.',
                user: {
                    id: user.ID,
                    name: user.FULL_NAME
                }
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'User with that email not found.'
            });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({
            success: false,
            message: 'An error occurred during login.'
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
});

module.exports = router;