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
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Not logged in." });
    }

    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        const result = await conn.execute(
            `SELECT full_name, phone, nid_photo, address, bio, profile_img 
             FROM users WHERE id = :id`,
            [req.session.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        // Convert Oracle result to expected format
        const settings = {
            full_name: result.rows[0].FULL_NAME || '',
            phone: result.rows[0].PHONE || '',
            nid_photo: result.rows[0].NID_PHOTO || '',
            address: result.rows[0].ADDRESS || '',
            bio: result.rows[0].BIO || '',
            profile_img: result.rows[0].PROFILE_IMG || ''
        };

        res.json({ success: true, settings });
    } catch (err) {
        console.error("Fetch settings error:", err);
        res.status(500).json({ success: false, message: "Failed to fetch settings." });
    } finally {
        if (conn) await conn.close();
    }
});

// POST /api/settings/update
router.post("/update", upload.single("profile_img"), async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Not logged in." });
    }

    const { full_name, phone, nid_photo, address, bio } = req.body;
    const profile_img = req.file ? req.file.filename : null;

    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);

        // Build dynamic update query to avoid updating with null values
        const updateFields = [];
        const params = { id: req.session.user.id };

        if (full_name !== undefined) {
            updateFields.push("full_name = :full_name");
            params.full_name = full_name;
        }
        if (phone !== undefined) {
            updateFields.push("phone = :phone");
            params.phone = phone;
        }
        if (nid_photo !== undefined) {
            updateFields.push("nid_photo = :nid_photo");
            params.nid_photo = nid_photo;
        }
        if (address !== undefined) {
            updateFields.push("address = :address");
            params.address = address;
        }
        if (bio !== undefined) {
            updateFields.push("bio = :bio");
            params.bio = bio;
        }
        if (profile_img) {
            updateFields.push("profile_img = :profile_img");
            params.profile_img = profile_img;
            // Update session
            req.session.user.profile_img = profile_img;
        }

        if (updateFields.length === 0) {
            return res.json({ success: false, message: "No fields to update." });
        }

        const query = `UPDATE users SET ${updateFields.join(", ")} WHERE id = :id`;
        await conn.execute(query, params);

        // Fetch the updated settings to return to frontend
        const result = await conn.execute(
            `SELECT full_name, phone, nid_photo, address, bio, profile_img 
             FROM users WHERE id = :id`,
            [req.session.user.id]
        );

        // Check if we got a result
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found after update." 
            });
        }

        // Format response to match frontend expectations
        const updatedSettings = {
            full_name: result.rows[0].FULL_NAME || '',
            phone: result.rows[0].PHONE || '',
            nid_photo: result.rows[0].NID_PHOTO || '',
            address: result.rows[0].ADDRESS || '',
            bio: result.rows[0].BIO || '',
            profile_img: result.rows[0].PROFILE_IMG || ''
        };

        console.log("Returning settings:", updatedSettings); // Debug log

        res.json({ 
            success: true, 
            message: "Settings updated successfully!", 
            settings: updatedSettings 
        });

    } catch (err) {
        console.error("Update settings error:", err);
        res.status(500).json({ 
            success: false, 
            message: "Failed to update settings: " + err.message 
        });
    } finally {
        if (conn) await conn.close();
    }
});

module.exports = router;