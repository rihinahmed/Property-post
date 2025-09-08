// server.js
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const oracledb = require("oracledb");
const path = require("path");
const helmet = require("helmet");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = 5000;

console.log("Server is running from directory:", __dirname);

// ===========================
// Oracle DB Config
// ===========================
const dbConfig = {
    user: "SYSTEM",
    password: "Rihin1234",
    connectString: "localhost/XEPDB1"
};

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];
oracledb.autoCommit = true;

// ===========================
// Middleware Setup
// ===========================

// Ensure upload directories exist
const sellerUploadDir = path.join(__dirname, "selleruploads");
const userUploadDir = path.join(__dirname, "useruploads");
fs.mkdirSync(sellerUploadDir, { recursive: true });
fs.mkdirSync(userUploadDir, { recursive: true });

// CORS
const allowedOrigins = ["http://localhost:5500", "http://127.0.0.1:5500"];
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// Security headers
app.use(helmet());

// JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer storage for profile uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, sellerUploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    }
});
const upload = multer({ storage });

// Static folders
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, "uploads")));
app.use('/selleruploads', express.static(sellerUploadDir));
app.use('/useruploads', express.static(userUploadDir));

// Session
app.use(session({
    secret: "roomfinder-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // localhost
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 // 1 hour
    }
}));

// ===========================
// Routes
// ===========================

// User signup
app.post("/api/user/signup", async (req, res) => {
    const { name, email, password, role } = req.body;
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        await conn.execute(
            `INSERT INTO users (name, email, password_hash, role) VALUES (:name, :email, :password, :role)`,
            { name, email, password, role }
        );
        res.json({ success: true, message: "User registered successfully!" });
    } catch (err) {
        console.error("Signup error:", err);
        if (err.errorNum === 1) {
            res.json({ success: false, message: "Email already exists!" });
        } else {
            res.status(500).json({ success: false, message: "Signup failed: " + err.message });
        }
    } finally {
        if (conn) await conn.close();
    }
});

// User login
app.post("/api/user/login", async (req, res) => {
    const { email, password, role } = req.body;
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        const result = await conn.execute(
            `SELECT id, name, password_hash, role, profile_img FROM users WHERE email = :email`,
            [email]
        );
        if (result.rows.length === 0)
            return res.json({ success: false, message: "User not found!" });

        const { ID, NAME, PASSWORD_HASH, ROLE, PROFILE_IMG } = result.rows[0];

        if (password !== PASSWORD_HASH)
            return res.json({ success: false, message: "Incorrect password!" });

        if (role.toLowerCase() !== ROLE.toLowerCase())
            return res.json({ success: false, message: "Incorrect role!" });

        req.session.user = { id: ID, name: NAME, email, role: ROLE, profile_img: PROFILE_IMG };

        res.json({
            success: true,
            message: "Login successful!",
            user: { id: ID, name: NAME, email, role: ROLE, profile_img: PROFILE_IMG }
        });
    } catch (err) {
        console.error("Login failed:", err);
        res.status(500).json({ success: false, message: "Login failed: " + err.message });
    } finally {
        if (conn) await conn.close();
    }
});

// Logout
app.post("/api/user/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) return res.json({ success: false });
        res.clearCookie("connect.sid");
        res.json({ success: true });
    });
});

// Session check
app.get("/api/user/session", (req, res) => {
    if (req.session.user) res.json({ loggedIn: true, user: req.session.user });
    else res.json({ loggedIn: false });
});

// ===========================
// Settings Routes (for sellersettings.html)
// ===========================
const settingsRouter = express.Router();

// GET user settings
settingsRouter.get("/", async (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: "Not logged in" });
    const userId = req.session.user.id;
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        const result = await conn.execute(
            `SELECT full_name, phone, nid_photo, address, bio, profile_img FROM users WHERE id = :id`,
            [userId]
        );
        res.json({ success: true, settings: result.rows[0] });
    } catch (err) {
        console.error("Fetch settings error:", err);
        res.status(500).json({ success: false, message: "Failed to fetch settings" });
    } finally {
        if (conn) await conn.close();
    }
});

// POST update settings (supports profile upload)
settingsRouter.post("/update", upload.single("profile_img"), async (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: "Not logged in" });
    const userId = req.session.user.id;
    const { full_name, phone, nid_photo, address, bio } = req.body;
    let profile_img = req.file ? req.file.filename : undefined;

    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);

        // Build dynamic update query
        const queryParts = [];
        const binds = { id: userId };
        if (full_name) { queryParts.push("full_name = :full_name"); binds.full_name = full_name; }
        if (phone) { queryParts.push("phone = :phone"); binds.phone = phone; }
        if (nid_photo) { queryParts.push("nid_photo = :nid_photo"); binds.nid_photo = nid_photo; }
        if (address) { queryParts.push("address = :address"); binds.address = address; }
        if (bio) { queryParts.push("bio = :bio"); binds.bio = bio; }
        if (profile_img) { queryParts.push("profile_img = :profile_img"); binds.profile_img = profile_img; }

        const updateQuery = `UPDATE users SET ${queryParts.join(", ")} WHERE id = :id`;
        await conn.execute(updateQuery, binds);

        res.json({ success: true, message: "Settings updated successfully!" });
    } catch (err) {
        console.error("Update settings error:", err);
        res.status(500).json({ success: false, message: "Failed to update settings" });
    } finally {
        if (conn) await conn.close();
    }
});

// Mount settings router
app.use("/api/settings", settingsRouter);

// ===========================
// Import & mount other route modules
// ===========================
const profileRoute = require("./routes/profileRoute");
const dashboardRoute = require("./routes/dashboardRoute");
const announcementRoutes = require('./routes/announcementRoutes');
const roomRoutes = require('./routes/roomRoutes');
const sellerdashboardRoutes = require('./routes/sellerdashboardRoutes');
const addproperties = require('./routes/addproperties');
const sellerProperties = require('./routes/sellerProperties');
const propertyUpdateRoute = require('./routes/propertyUpdateRoute');
const messagesRoute = require('./routes/messageRoute');
const analyticsRouter = require('./routes/analyticsRoute');
const authRoutes = require('./routes/authRoute');
const settingsRoute = require('./routes/settingsRoute');
const searchProperties = require('./routes/searchProperties');

app.use('/api/properties', addproperties);
app.use("/api/user/profile", profileRoute);
app.use("/api/dashboard", dashboardRoute);
app.use('/api/announcements', announcementRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/seller', sellerdashboardRoutes);
app.use('/api/seller', sellerProperties);
app.use('/api/property', propertyUpdateRoute);
app.use('/api/messages', messagesRoute);
app.use('/api/analytics', analyticsRouter);
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoute);
app.use('/api/search', searchProperties);

// 404 fallback
app.use((req, res) => {
    res.status(404).json({ success: false, message: "API route not found." });
});

// ===========================
// Start Server
// ===========================
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
