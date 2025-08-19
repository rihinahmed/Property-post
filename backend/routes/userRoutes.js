// backend/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const oracledb = require("oracledb");
const dbConfig = require("../config/db");

// WARNING: Insecure password handling. Use for learning only.

// POST /login: Handle user login
router.post("/login", async (req, res) => {
    const { email, password, role } = req.body;
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        console.log("✅ Oracle connected");

        const result = await connection.execute(
            `SELECT id, name, email, password_hash, role FROM users WHERE email = :email`,
            { email },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length === 1) {
            const user = result.rows[0];

            if (password === user.PASSWORD_HASH) {
                if (role && role !== user.ROLE) {
                    return res.json({ success: false, message: "Incorrect role!" });
                }

                req.session.user = {
                    id: user.ID,
                    name: user.NAME,
                    email: user.EMAIL,
                    role: user.ROLE
                };

                return res.json({
                    success: true,
                    message: "Login successful",
                    user: req.session.user
                });
            } else {
                return res.json({ success: false, message: "Incorrect password" });
            }
        } else {
            return res.json({ success: false, message: "User not found" });
        }
    } catch (err) {
        console.error("❌ Server error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    } finally {
        if (connection) await connection.close();
    }
});

// GET /session: Check if a user is logged in
router.get("/session", (req, res) => {
    if (req.session.user) {
        return res.json({ loggedIn: true, user: req.session.user });
    } else {
        return res.json({ loggedIn: false });
    }
});

// POST /logout: Log the user out
router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Could not log out" });
        }
        res.clearCookie("connect.sid");
        res.json({ success: true, message: "Logged out successfully" });
    });
});

// POST /change-password: Change the user's password
router.post('/change-password', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.session.user.id;

    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        const result = await conn.execute(
            `SELECT password_hash FROM users WHERE id = :id`,
            [userId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const user = result.rows[0];

        if (!user || currentPassword !== user.PASSWORD_HASH) {
            return res.status(400).json({ success: false, message: 'Incorrect current password.' });
        }

        await conn.execute(
            `UPDATE users SET password_hash = :newPassword WHERE id = :id`,
            { newPassword: newPassword, id: userId },
            { autoCommit: true }
        );

        return res.json({ success: true, message: 'Password changed successfully.' });

    } catch (err) {
        console.error('❌ Error changing password:', err);
        return res.status(500).json({ success: false, message: 'Server error. Could not change password.' });
    } finally {
        if (conn) {
            try { await conn.close(); } catch (e) { console.error(e); }
        }
    }
});

module.exports = router;