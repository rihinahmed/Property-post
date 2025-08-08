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
app.use('/selleruploads', express.static(path.join(__dirname, 'selleruploads')));

app.use(session({
  secret: "roomfinder-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,       // Set to true if using HTTPS
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 // 1 hour
  }
}));



// ===========================
// User Signup Route
// ===========================
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
    if (err.errorNum === 1) { // Unique constraint violation
      res.json({ success: false, message: "Email already exists!" });
    } else {
      res.json({ success: false, message: "Signup failed: " + err.message });
    }
  }
});

// ===========================
// User Login Route
// ===========================
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

    // Store full session
    req.session.user = { id, name, email, role };

    res.json({
      success: true,
      message: "Login successful!",
      user: { id, name, email, role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Login failed: " + err.message });
  }
});

// ===========================
// User Logout Route
// ===========================
app.post("/api/user/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.json({ success: false });
    }
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

// ===========================
// Session Check Route
// ===========================
app.get("/api/user/session", (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// ===========================
// Other Routes
// ===========================
// Import your route modules here
const profileRoute = require("./routes/profileRoute");
const dashboardRoute = require("./routes/dashboardRoute");
const announcementRoutes = require('./routes/announcementRoutes');
const roomRoutes = require('./routes/roomRoutes');
const sellerdashboardRoutes = require('./routes/sellerdashboardRoutes');
const addproperties = require('./routes/addproperties');

app.use('/api/properties', addproperties);
app.use("/api/user/profile", profileRoute);
app.use("/api/dashboard", dashboardRoute);
app.use('/api/announcements', announcementRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/seller', sellerdashboardRoutes);

// ===========================
// Optional 404 Handler
// ===========================
app.use((req, res) => {
  res.status(404).json({ success: false, message: "API route not found." });
});

// ===========================
// Start Server
// ===========================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
