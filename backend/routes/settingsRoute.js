const express = require('express');
const oracledb = require('oracledb');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dbConfig = require('../config/db'); 

const router = express.Router();
console.log("✅ settingsRoute.js loaded");

// ===========================
// Multer config for profile images
// ===========================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../selleruploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = `profile_${Date.now()}${ext}`;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage });

// ===========================
// GET user settings at the /api/settings route
// ===========================
router.get('/settings', async (req, res) => {
    // Security check: Ensure user is logged in
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    let connection;
    try {
        const userEmail = req.session.user.email;
        connection = await oracledb.getConnection(dbConfig);

        const result = await connection.execute(
            `SELECT ID, FULL_NAME, PHONE, NID_PHOTO, ADDRESS, BIO, PROFILE_IMG FROM USERS WHERE EMAIL = :email`,
            { email: userEmail },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const s = result.rows[0];
        res.json({
            success: true,
            settings: {
                id: s.ID,
                full_name: s.FULL_NAME,
                phone: s.PHONE,
                nid_photo: s.NID_PHOTO,
                address: s.ADDRESS,
                bio: s.BIO,
                profile_img: s.PROFILE_IMG
            }
        });

    } catch (err) {
        console.error('Error fetching settings:', err);
        res.status(500).json({ success: false, message: `Error fetching settings: ${err.message}` });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
});

// ===========================
// POST update user settings at the /api/settings/update route
// ===========================
router.post('/settings/update', upload.single('profile_img'), async (req, res) => {
    // Security check: Ensure user is logged in
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    let connection;
    try {
        console.log("Incoming form data:", req.body);
        console.log("Incoming file:", req.file);

        const userId = parseInt(req.session.user.id, 10);
        
        const { full_name, phone, address, bio, nid_photo } = req.body;
        const profileImgFile = req.file;

        connection = await oracledb.getConnection(dbConfig);

        let updateQuery = `
            UPDATE USERS SET
                FULL_NAME = :full_name,
                PHONE = :phone,
                ADDRESS = :address,
                BIO = :bio,
                NID_PHOTO = :nid_photo
        `;
        const bindings = { full_name, phone, address, bio, nid_photo, id: userId };

        if (profileImgFile) {
            updateQuery += `, PROFILE_IMG = :profile_img`;
            bindings.profile_img = profileImgFile.filename;
        }

        updateQuery += ` WHERE ID = :id`;

        const result = await connection.execute(updateQuery, bindings, { autoCommit: true });

        if (result.rowsAffected > 0) {
            if (profileImgFile) {
                req.session.user.profile_img = profileImgFile.filename;
            }
            res.json({ success: true, message: 'Settings updated successfully.' });
        } else {
            res.status(404).json({ success: false, message: 'User not found or no changes made.' });
        }

    } catch (err) {
        console.error('❌ Error updating settings:', err); 
        res.status(500).json({ success: false, message: `An error occurred: ${err.message}` });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
});

module.exports = router;
