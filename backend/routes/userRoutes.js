const express = require("express");
const router = express.Router();
const oracledb = require("oracledb");
const dbConfig = require("../config/db");
const logActivity = require("../utils/logger");

// Seller insertion utility
async function insertSellerIfNotExists(connection, user) {
  const check = await connection.execute(
    `SELECT * FROM sellers WHERE user_id = :id`,
    { id: user.ID },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );

  if (check.rows.length === 0) {
    await connection.execute(
      `INSERT INTO sellers (user_id, name, email, profile_img) VALUES (:id, :name, :email, :img)`,
      {
        id: user.ID,
        name: user.NAME,
        email: user.EMAIL,
        img: user.PROFILE_IMG || null
      },
      { autoCommit: true }
    );
    console.log("📝 Seller added to sellers table.");
  } else {
    console.log("⚠️ Seller already exists in sellers table.");
  }
}

router.post("/login", async (req, res) => {
  const { email, password, role } = req.body;
  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);
    console.log("✅ Oracle connected");

    const result = await connection.execute(
      `SELECT id, name, email, password_hash, role, profile_img FROM users WHERE email = :email`,
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

        await logActivity(user.ID, "Login", "Success", "User logged in");
        console.log("✅ Session created:", req.session.user);

        // If seller, insert to sellers table if not already present
        if (user.ROLE === "seller") {
          await insertSellerIfNotExists(connection, user);
        }

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

module.exports = router;
