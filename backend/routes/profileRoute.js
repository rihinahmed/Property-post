// backend/routes/profileRoute.js
const express = require("express");
const router = express.Router();
const oracledb = require("oracledb");
const multer = require("multer");
const path = require("path");
const dbConfig = require("../config/db"); // or use your inline dbConfig if not separated

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// ✅ POST: Upload Profile
router.post(
  "/",
  upload.fields([
    { name: "nid_photo", maxCount: 1 },
    { name: "profile_image", maxCount: 1 }
  ]),
  async (req, res) => {
    const { fullName, phoneNumber, address, occupation } = req.body;
    const user = req.session.user;

    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const profileImg = req.files["profile_image"]?.[0]?.filename || null;
    const nidPhoto = req.files["nid_photo"]?.[0]?.filename || null;

    try {
      const conn = await oracledb.getConnection(dbConfig);

      await conn.execute(
        `UPDATE users
         SET full_name = :full_name,
             phone = :phone,
             address = :address,
             occupation = :occupation,
             profile_img = :profile_img,
             nid_photo = :nid_photo
         WHERE id = :id`,
        {
          full_name: fullName,
          phone: phoneNumber,
          address,
          occupation,
          profile_img: profileImg,
          nid_photo: nidPhoto,
          id: user.id
        },
        { autoCommit: true }
      );

      await conn.close();

      // ✅ Update session for live reflection
      req.session.user.profile_img = profileImg;

      res.json({
        success: true,
        message: "User profile updated",
        profile_img: profileImg
      });
    } catch (err) {
      console.error("❌ Error saving profile:", err);
      res.status(500).json({ success: false, message: "Database error" });
    }
  }
);

// ✅ GET: Fetch existing profile data
router.get("/", async (req, res) => {
  const user = req.session.user;

  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const conn = await oracledb.getConnection(dbConfig);
    const result = await conn.execute(
      `SELECT full_name, phone, address, occupation, profile_img, nid_photo FROM users WHERE id = :id`,
      [user.id]
    );

    await conn.close();

    const data = result.rows[0];
    if (!data) {
      return res.json({ success: false, message: "User data not found" });
    }

    const [fullName, phone, address, occupation, profile_img, nid_photo] = data;

    res.json({
      success: true,
      data: {
        fullName,
        phone,
        address,
        occupation,
        profile_img,
        nid_photo
      }
    });
  } catch (err) {
    console.error("❌ Profile fetch error:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

module.exports = router;
