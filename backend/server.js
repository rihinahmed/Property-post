const express = require("express");
const cors = require("cors");
const session = require("express-session");
const oracledb = require("oracledb");
const path = require("path");
const helmet = require("helmet");
const multer = require("multer");

const app = express();
console.log("Server is running from directory:", __dirname);
const PORT = 5000;

// ===========================
// Oracle DB Config and Setup
// ===========================
const dbConfig = {
    user: "SYSTEM",
    password: "Rihin1234",
    connectString: "localhost/XEPDB1"
};

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];
oracledb.autoCommit = true;

// CORS Configuration
const allowedOrigins = ["http://localhost:5500", "http://127.0.0.1:5500"];
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// Security headers
app.use(helmet());

// Middleware to parse JSON bodies

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, 'selleruploads')); // Upload folder
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext); // Unique filename
    }
});
const upload = multer({ storage });
app.use(express.json());


// Static folders to serve uploaded files and public assets
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, "uploads")));
app.use('/selleruploads', express.static(path.join(__dirname, 'selleruploads')));
app.use('/useruploads', express.static(path.join(__dirname, 'useruploads')));

// Session setup
app.use(session({
    secret: "roomfinder-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 // 1 hour
    }
}));

// ===========================
// Routes
// ===========================

// User authentication routes (already correct)
app.post("/api/user/signup", async (req, res) => {
    const { name, email, password, role } = req.body;
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        await conn.execute(
            `INSERT INTO users (name, email, password_hash, role)
             VALUES (:name, :email, :password, :role)`,
            { name, email, password, role },
        );
        res.json({ success: true, message: "User registered successfully!" });
    } catch (err) {
        console.error("❌ Signup failed:", err);
        if (err.errorNum === 1) {
            res.json({ success: false, message: "Email already exists!" });
        } else {
            res.status(500).json({ success: false, message: "Signup failed: " + err.message });
        }
    } finally {
        if (conn) {
            try {
                await conn.close();
            } catch (err) {
                console.error("❌ Error closing connection:", err);
            }
        }
    }
});

app.post("/api/user/login", async (req, res) => {
    const { email, password, role } = req.body;
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        const result = await conn.execute(
            `SELECT id, name, password_hash, role, profile_img FROM users WHERE email = :email`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.json({ success: false, message: "User not found!" });
        }

        const { ID, NAME, PASSWORD_HASH, ROLE, PROFILE_IMG } = result.rows[0];

        if (password !== PASSWORD_HASH) {
            return res.json({ success: false, message: "Incorrect password!" });
        }
        if (role !== ROLE) {
            return res.json({ success: false, message: "Incorrect role!" });
        }

        req.session.user = { id: ID, name: NAME, email, role: ROLE, profile_img: PROFILE_IMG };

        res.json({
            success: true,
            message: "Login successful!",
            user: { id: ID, name: NAME, email, role: ROLE, profile_img: PROFILE_IMG }
        });
    } catch (err) {
        console.error("❌ Login failed:", err);
        res.status(500).json({ success: false, message: "Login failed: " + err.message });
    } finally {
        if (conn) {
            try {
                await conn.close();
            } catch (err) {
                console.error("❌ Error closing connection:", err);
            }
        }
    }
});

app.post("/api/user/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) return res.json({ success: false });
        res.clearCookie("connect.sid");
        res.json({ success: true });
    });
});

app.get("/api/user/session", (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

// Import and use your route modules
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
const settingsRouter = require('./routes/settingsRoute');
const authRoutes = require('./routes/authRoute');

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
app.use('/api', settingsRouter); // <-- FIX: Changed this line from '/api/settings' to '/api'
app.use('/api/auth', authRoutes);

// 404 fallback for undefined API routes
app.use((req, res) => {
    res.status(404).json({ success: false, message: "API route not found." });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
