const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const dbConfig = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure selleruploads directory exists
const uploadDir = path.join(__dirname, '..', 'selleruploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    } catch (err) {
      console.error('Filename error:', err);
      cb(err);
    }
  }
});

const upload = multer({ storage });

router.post('/add', upload.array('images', 10), async (req, res) => {
  try {
    // Check logged-in user
    if (!req.session.user || !req.session.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User not logged in' });
    }
    const seller_id = req.session.user.id;

    // Destructure fields from req.body
    const { title, rent, description, amenities, pros, cons, location } = req.body;

    // Debug logs
    console.log('Received files:', req.files);
    console.log('Received body:', req.body);

    // Prepare images string for DB
    const imageFilenames = req.files && req.files.length > 0
      ? req.files.map(f => f.filename).join(',')
      : '';

    const connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `INSERT INTO properties (seller_id, title, rent, description, amenities, pros, cons, images, location)
       VALUES (:seller_id, :title, :rent, :description, :amenities, :pros, :cons, :images, :location)`,
      { seller_id, title, rent, description, amenities, pros, cons, images: imageFilenames, location },
      { autoCommit: true }
    );
    await connection.close();

    return res.json({ success: true, message: 'Property added successfully.' });
  } catch (err) {
    console.error('Insert error:', err);
    return res.status(500).json({ success: false, error: 'Failed to add property.' });
  }
});

module.exports = router;
