// routes/propertyUpdateRoute.js
const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const dbConfig = require('../config/db');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];
oracledb.autoCommit = true;

/**
 * GET single property
 */
router.get("/:id", async (req, res) => {
    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) {
        return res.status(400).json({ success: false, message: "Invalid property ID" });
    }

    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);

        const result = await conn.execute(
            `SELECT ID, SELLER_ID, TITLE, RENT, DESCRIPTION, AMENITIES, PROS, CONS, 
                     IMAGES, LOCATION, CREATED_AT, STATUS, SAVED_COUNT, VIEWS
             FROM PROPERTIES
             WHERE ID = :id`,
            [propertyId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Property not found" });
        }

        const row = result.rows[0];
        const property = {
            property_id: row.ID,
            seller_id: row.SELLER_ID,
            title: row.TITLE,
            rent: row.RENT,
            description: row.DESCRIPTION,
            amenities: (row.AMENITIES || '').split(',').filter(a => a),
            pros: (row.PROS || '').split(',').filter(p => p),
            cons: (row.CONS || '').split(',').filter(c => c),
            images: (row.IMAGES || '').split(',').filter(i => i),
            views: row.VIEWS,
            saved_count: row.SAVED_COUNT,
            status: row.STATUS,
            // The GET route correctly handles the location object
            location: row.LOCATION ? {
                house: row.LOCATION.HOUSE || '',
                street: row.LOCATION.STREET || '',
                area: row.LOCATION.AREA || '',
                district: row.LOCATION.DISTRICT || '',
                postal_code: row.LOCATION.POSTAL_CODE || ''
            } : {
                house: '', street: '', area: '', district: '', postal_code: ''
            }
        };

        res.json({ success: true, data: property });

    } catch (err) {
        console.error("❌ GET property error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    } finally {
        if (conn) try { await conn.close(); } catch (err) { console.error(err); }
    }
});

/**
 * PUT update property
 */
router.put("/:id", async (req, res) => {
    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) {
        return res.status(400).json({ success: false, message: "Invalid property ID" });
    }

    // Safely destructure all fields from the request body
    const {
        title, rent, description, amenities, pros, cons, status, location
    } = req.body;

    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        
        // This is the key change:
        // Now you are correctly mapping the lowercase keys from the frontend
        // to the uppercase keys required by the Oracle object.
        const mergedLocation = {
            HOUSE: location.house,
            STREET: location.street,
            AREA: location.area,
            DISTRICT: location.district,
            POSTAL_CODE: location.postal
        };

        const result = await conn.execute(
            `UPDATE PROPERTIES
             SET TITLE = :title,
                 RENT = :rent,
                 DESCRIPTION = :description,
                 AMENITIES = :amenities,
                 PROS = :pros,
                 CONS = :cons,
                 STATUS = :status,
                 LOCATION = :location
             WHERE ID = :id`,
            {
                id: propertyId,
                title,
                rent,
                description,
                amenities: amenities.join(','),
                pros: pros.join(','),
                cons: cons.join(','),
                status,
                location: { type: "LOCATIONN", val: mergedLocation }
            },
            { autoCommit: true }
        );

        if (result.rowsAffected === 1) {
            res.json({ success: true, message: "Property updated successfully" });
        } else {
            res.status(404).json({ success: false, message: "Property not found or no changes made." });
        }

    } catch (err) {
        console.error("❌ PUT property error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    } finally {
        if (conn) try { await conn.close(); } catch (err) { console.error(err); }
    }
});

module.exports = router;