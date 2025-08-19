const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const dbConfig = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the uploads directory exists (recursive true)
const uploadDir = path.join(__dirname, '..', 'selleruploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config: save files in selleruploads with unique filenames
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

// Accept only image files (jpeg, png, jpg, gif, webp)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'));
    }
};

const upload = multer({ storage, fileFilter });

// POST /add route to add property with images upload
router.post('/add', (req, res) => {
    upload.array('images', 10)(req, res, async (err) => {
        if (err) {
            console.error('Upload error:', err);
            return res.status(400).json({ success: false, error: err.message });
        }

        if (!req.session?.user?.id) {
            return res.status(401).json({ success: false, message: 'Unauthorized: User not logged in' });
        }

        const seller_id = req.session.user.id;
        let { title, rent, description, amenities, pros, cons, location } = req.body;

        amenities = amenities || null;
        pros = pros || null;
        cons = cons || null;
        
        let rentNumber = null;
        if (rent) {
            if (!isNaN(rent)) {
                rentNumber = Number(rent);
            } else {
                return res.status(400).json({ success: false, error: 'Rent must be a valid number.' });
            }
        }

        console.log('Files received:', req.files);
        console.log('Form data:', req.body);
        console.log('Processed data for DB:', { seller_id, title, rent: rentNumber, description, amenities, pros, cons, location });

        const imageFilenames = (req.files && req.files.length)
            ? req.files.map(f => f.filename).join(',')
            : null;
        
        let connection;
        try {
            // Use Promise.race to implement a connection timeout (e.g., 5 seconds)
            const connectionPromise = oracledb.getConnection(dbConfig);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('DB connection attempt timed out.')), 5000)
            );
            
            console.log('Attempting to connect to database...');
            connection = await Promise.race([connectionPromise, timeoutPromise]);
            
            const result = await connection.execute(
                `INSERT INTO properties (
                    seller_id, title, rent, description, amenities, pros, cons, images, location
                ) VALUES (
                    :seller_id, :title, :rent, :description, :amenities, :pros, :cons, :images, :location
                )`,
                {
                    seller_id,
                    title,
                    rent: rentNumber,
                    description,
                    amenities,
                    pros,
                    cons,
                    images: imageFilenames,
                    location
                },
                { autoCommit: true }
            );
            console.log('Database insert successful. Rows affected:', result.rowsAffected);
            res.json({ success: true, message: 'Property added successfully.' });
        } catch (dbErr) {
            console.error('DB Insert error:', dbErr);
            console.error('Oracle Error Message:', dbErr.message);
            console.error('Oracle Error Number:', dbErr.errorNum);
            res.status(500).json({ success: false, error: 'Failed to add property.' });
        } finally {
            if (connection) {
                try {
                    await connection.close();
                } catch (closeErr) {
                    console.error('Error closing DB connection:', closeErr);
                }
            }
        }
    });
});

module.exports = router;