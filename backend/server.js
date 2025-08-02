const express = require("express");
const cors = require("cors");
const session = require("express-session");
const oracledb = require("oracledb");
const bodyParser = require("body-parser");

const app = express();
const PORT = 5000;

// ✅ Oracle DB Config
const dbConfig = {
  user: "SYSTEM", // Replace with your actual user
  password: "Rihin1234", // Replace with your actual password
  connectString: "localhost/XEPDB1"
};

// ✅ CORS Setup (Allow both localhost & 127.0.0.1)
const allowedOrigins = ["http://localhost:5500", "http://127.0.0.1:5500"];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"), false);
  },
  credentials: true
}));

// ✅ Middleware
app.use(bodyParser.json());
app.use(session({
  secret: "roomfinder-secret",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Use true in production (HTTPS)
}));

// ✅ ROUTES ==========================

// SIGNUP
app.post("/api/user/signup", async (req, res) => {
  const { name, email, password, role } = req.body;
  console.log("🟡 Signup Request:", { name, email, password, role });

  try {
    const conn = await oracledb.getConnection(dbConfig);

    const result = await conn.execute(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (:name, :email, :password, :role)`,
      { name, email, password, role },
      { autoCommit: true }
    );

    await conn.close();
    console.log("✅ Signup successful");
    res.json({ success: true, message: "User registered successfully!" });

  } catch (err) {
    console.error("❌ Signup Error:", err);
    if (err.errorNum === 1) {
      res.json({ success: false, message: "Email already exists!" });
    } else {
      res.json({ success: false, message: "Signup failed: " + err.message });
    }
  }
});

// LOGIN
app.post("/api/user/login", async (req, res) => {
  const { email, password, role } = req.body;
  console.log("🟡 Login Request:", { email, role });

  try {
    const conn = await oracledb.getConnection(dbConfig);
    const result = await conn.execute(
      `SELECT id, name, password_hash, role FROM users WHERE email = :email`,
      [email]
    );

    await conn.close();

    if (result.rows.length === 0) {
      return res.json({ success: false, message: "User not found!" });
    }

    const [id, name, dbPassword, dbRole] = result.rows[0];

    if (password !== dbPassword) {
      return res.json({ success: false, message: "Incorrect password!" });
    }

    if (role !== dbRole) {
      return res.json({ success: false, message: "Incorrect role!" });
    }

    req.session.user = { id, name, email, role };
    console.log("✅ Session created:", req.session.user);

    res.json({
      success: true,
      message: "Login successful!",
      user: { name, role }
    });

  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ success: false, message: "Login failed: " + err.message });
  }
});

// LOGOUT
app.post("/api/user/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("❌ Logout Error:", err);
      return res.json({ success: false });
    }
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

// SESSION CHECK
app.get("/api/user/session", (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
