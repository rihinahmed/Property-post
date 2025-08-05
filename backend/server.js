const express = require("express");
const cors = require("cors");
const session = require("express-session");
const oracledb = require("oracledb");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = 5000;

// Oracle DB Config
const dbConfig = {
  user: "SYSTEM",
  password: "Rihin1234",
  connectString: "localhost/XEPDB1"
};

// CORS Configuration
const allowedOrigins = ["http://localhost:5500", "http://127.0.0.1:5500"];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, "uploads")));

app.use(session({
  secret: "roomfinder-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60
  }
}));

// Routes

// Signup Route
app.post("/api/user/signup", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const conn = await oracledb.getConnection(dbConfig);
    await conn.execute(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (:name, :email, :password, :role)`,
      { name, email, password, role },
      { autoCommit: true }
    );
    await conn.close();

    res.json({ success: true, message: "User registered successfully!" });
  } catch (err) {
    if (err.errorNum === 1) {
      res.json({ success: false, message: "Email already exists!" });
    } else {
      res.json({ success: false, message: "Signup failed: " + err.message });
    }
  }
});

// Login Route
app.post("/api/user/login", async (req, res) => {
  const { email, password, role } = req.body;

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

    res.json({
      success: true,
      message: "Login successful!",
      user: { name, role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Login failed: " + err.message });
  }
});

// Logout Route
app.post("/api/user/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.json({ success: false });
    }
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

// Session Check Route
app.get("/api/user/session", (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// Profile Upload Route
const profileRoute = require("./routes/profileRoute");
app.use("/api/user/profile", profileRoute);

// Dashboard update route
const dashboardRoute = require("./routes/dashboardRoute");
app.use("/api/dashboard", dashboardRoute);

// Session route register
const sessionRoute = require('./routes/sessionRoute');
app.use('/api/user/session', sessionRoute);


// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
