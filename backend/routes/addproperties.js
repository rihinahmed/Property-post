const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const dbConfig = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'selleruploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    cb(extname && mimetype ? null : new Error('Only image files allowed'), extname && mimetype);
};

const upload = multer({ storage, fileFilter });

// POST /add
router.post('/add', (req, res) => {
    upload.array('images', 10)(req, res, async (err) => {
        if (err) return res.status(400).json({ success: false, error: err.message });
        if (!req.session?.user?.id) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const seller_id = req.session.user.id;
        let { title, rent, description, amenities, pros, cons, location_house, location_street, location_area, location_district, location_postal } = req.body;

        // Validate required fields
        if (!title || !rent || !location_house || !location_street || !location_area || !location_district) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        let rentNumber = Number(rent);
        if (isNaN(rentNumber)) return res.status(400).json({ success: false, message: 'Rent must be a number' });

        // Optional arrays: store as comma-separated
        amenities = amenities || null;
        pros = pros || null;
        cons = cons || null;

        const imageFilenames = req.files.length ? req.files.map(f => f.filename).join(',') : null;

        let connection;
        try {
            connection = await oracledb.getConnection(dbConfig);

            const result = await connection.execute(
                `INSERT INTO properties (
                    seller_id, title, rent, description, amenities, pros, cons, images, location
                ) VALUES (
                    :seller_id, :title, :rent, :description, :amenities, :pros, :cons, :images,
                    locationn(:house, :street, :area, :district, :postal_code)
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
                    house: req.body.location_house,
                    street: req.body.location_street,
                    area: req.body.location_area,
                    district: req.body.location_district,
                    postal_code: req.body.location_postal
                },
                { autoCommit: true }
            );
            
              

            res.json({ success: true, message: 'Property added successfully.' });
        } catch (dbErr) {
            console.error('DB Insert error:', dbErr);
            res.status(500).json({ success: false, error: 'Failed to add property.' });
        } finally {
            if (connection) await connection.close().catch(e => console.error('Close DB error:', e));
        }
    });
});

module.exports = router;
