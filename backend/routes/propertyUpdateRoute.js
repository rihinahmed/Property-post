// routes/propertyUpdateRoute.js

const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const dbConfig = require('../config/db'); // Assuming this file exists and exports the dbConfig

// Configure Oracle DB for the router
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB]; // Handle CLOBs as strings
oracledb.autoCommit = true;

/**
 * @api {get} /api/property/:id Get a single property by ID
 * @apiDescription Fetches all details for a single property from the 'properties' table.
 */
router.get("/:id", async (req, res) => {
    console.log("🔍 [GET /api/property/:id] Request received.");
    const propertyId = parseInt(req.params.id);
    console.log(`🔍 [GET /api/property/:id] Property ID from URL: ${propertyId}`);
    
    if (isNaN(propertyId)) {
        console.error("❌ [GET /api/property/:id] Invalid property ID received.");
        return res.status(400).json({ success: false, message: "Invalid property ID" });
    }
    
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        console.log("🟢 [GET /api/property/:id] Database connection established.");
        
        const sqlQuery = `
            SELECT 
                ID, SELLER_ID, TITLE, RENT, DESCRIPTION, AMENITIES, PROS, CONS, 
                IMAGES, LOCATION, CREATED_AT, STATUS, SAVED_COUNT, VIEWS
            FROM properties 
            WHERE ID = :property_id`;
        
        console.log("🔍 [GET /api/property/:id] Executing SQL:", sqlQuery);
        
        const result = await conn.execute(sqlQuery, [propertyId]);
        
        if (result.rows.length === 0) {
            console.log("⚠️ [GET /api/property/:id] Property not found.");
            return res.status(404).json({ success: false, message: "Property not found" });
        }
        
        const row = result.rows[0];
        const property = {
            property_id: row.ID,
            seller_id: row.SELLER_ID,
            title: row.TITLE,
            location: row.LOCATION,
            rent: row.RENT,
            description: row.DESCRIPTION,
            // Convert comma-separated string from DB back to an array
            amenities: (row.AMENITIES || '').split(","),
            pros: (row.PROS || '').split(","),
            cons: (row.CONS || '').split(","),
            images: (row.IMAGES || '').split(","),
            views: row.VIEWS,
            saved_count: row.SAVED_COUNT,
            status: row.STATUS
        };
        
        console.log("🟢 [GET /api/property/:id] Sending JSON response.");
        res.json({ success: true, data: property });
    } catch (err) {
        console.error("❌ [GET /api/property/:id] DB Error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    } finally {
        if (conn) {
            try { await conn.close(); } catch (err) { console.error(err); }
        }
    }
});

/**
 * @api {put} /api/property/:id Update a single property
 * @apiDescription This endpoint updates a single property in the database.
 */
router.put("/:id", async (req, res) => {
    console.log("🔍 [PUT /api/property/:id] Request received.");
    const propertyId = parseInt(req.params.id);
    const { title, location, rent, description, amenities, pros, cons, images, status } = req.body;
    
    console.log(`🔍 [PUT /api/property/:id] Property ID: ${propertyId}, Data:`, req.body);
    
    if (isNaN(propertyId) || !title || !location || isNaN(rent)) {
        console.error("❌ [PUT /api/property/:id] Invalid request data.");
        return res.status(400).json({ success: false, message: "Invalid request data" });
    }
    
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        
        // Convert arrays from the request body back to comma-separated strings
        const amenitiesStr = amenities.join(',');
        const prosStr = pros.join(',');
        const consStr = cons.join(',');
        const imagesStr = images.join(',');
        
        const result = await conn.execute(
            `UPDATE properties 
             SET TITLE = :title, LOCATION = :location, RENT = :rent, DESCRIPTION = :description,
                 AMENITIES = :amenities, PROS = :pros, CONS = :cons, IMAGES = :images, STATUS = :status
             WHERE ID = :id`,
            {
                title, location, rent, description, amenities: amenitiesStr,
                pros: prosStr, cons: consStr, images: imagesStr, status, id: propertyId
            },
            { autoCommit: true }
        );
        
        if (result.rowsAffected === 1) {
            console.log("🟢 [PUT /api/property/:id] Property updated successfully.");
            res.json({ success: true, message: "Property updated successfully" });
        } else {
            console.log("⚠️ [PUT /api/property/:id] Property not found or no changes made.");
            res.status(404).json({ success: false, message: "Property not found" });
        }
    } catch (err) {
        console.error("❌ [PUT /api/property/:id] DB Error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    } finally {
        if (conn) {
            try { await conn.close(); } catch (err) { console.error(err); }
        }
    }
});

module.exports = router;
