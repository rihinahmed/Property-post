router.post('/login', async (req, res) => {
  const { email, password, role } = req.body; // Include role if your login form includes it
  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);
    console.log("✅ Oracle connected");

    const result = await connection.execute(
      `SELECT id, name, email, password_hash, role, profile_img FROM users WHERE email = :email`,
      { email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log("🔍 DB Result:", result.rows);

    if (result.rows.length === 1) {
      const user = result.rows[0];

      // Compare plaintext password (⚠️ not secure — for demo/dev only)
      if (password === user.PASSWORD_HASH) {
        if (role && role !== user.ROLE) {
          return res.json({ success: false, message: "Incorrect role!" });
        }

        req.session.user = {
          id: user.ID,
          name: user.NAME,
          email: user.EMAIL,
          role: user.ROLE,
          profile_img: user.PROFILE_IMG
        };

        console.log("✅ Session created:", req.session.user);

        return res.json({
          success: true,
          message: "Login successful",
          user: req.session.user
        });
      } else {
        console.log("❌ Password mismatch");
        return res.json({ success: false, message: "Incorrect password" });
      }
    } else {
      console.log("❌ User not found");
      return res.json({ success: false, message: "User not found" });
    }
  } catch (err) {
    console.error("❌ Server error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    if (connection) await connection.close();
  }
});
