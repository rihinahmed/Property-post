const express = require("express");
const router = express.Router();
const oracledb = require("oracledb");
const multer = require("multer");
const path = require("path");

// Multer setup for profile images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../selleruploads"));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, "profile-" + uniqueSuffix + ext);
    }
});
const upload = multer({ storage });

const dbConfig = {
    user: "SYSTEM",
    password: "Rihin1234",
    connectString: "localhost/XEPDB1"
};

// GET /api/settings
router.get("/", async (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: "Not logged in." });

    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        const result = await conn.execute(
            `SELECT full_name, phone, nid_photo, address, bio, profile_img 
             FROM users WHERE id = :id`,
            [req.session.user.id]
        );

        if (result.rows.length === 0) return res.status(404).json({ success: false, message: "User not found." });

        res.json({ success: true, settings: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to fetch settings." });
    } finally {
        if (conn) await conn.close();
    }
});

// POST /api/settings/update
router.post("/update", upload.single("profile_img"), async (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: "Not logged in." });

    const { full_name, phone, nid_photo, address, bio } = req.body;
    const profile_img = req.file ? req.file.filename : null;

    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);

        // Update user settings
        let query = `UPDATE users SET full_name = :full_name, phone = :phone, nid_photo = :nid_photo, address = :address, bio = :bio`;
        const params = { full_name, phone, nid_photo, address, bio, id: req.session.user.id };

        if (profile_img) {
            query += `, profile_img = :profile_img`;
            params.profile_img = profile_img;
            req.session.user.profile_img = profile_img; // update session
        }

        query += ` WHERE id = :id`;

        await conn.execute(query, params);

        // Fetch updated settings to return to frontend
        const result = await conn.execute(
            `SELECT full_name, phone, nid_photo, address, bio, profile_img 
             FROM users WHERE id = :id`,
            [req.session.user.id]
        );

        res.json({ success: true, message: "Settings saved successfully!", settings: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to update settings." });
    } finally {
        if (conn) await conn.close();
    }
});

module.exports = router;
