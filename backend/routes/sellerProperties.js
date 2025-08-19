const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const dbConfig = require('../config/db');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];
oracledb.autoCommit = true;

// 1. Route to Get All Properties for a Seller
router.get("/properties", async (req, res) => {
    console.log("🔍 [GET /api/seller/properties] Request received.");
    
    const sellerId = parseInt(req.query.seller_id);
    console.log(`🔍 [GET /api/seller/properties] Seller ID from frontend: ${sellerId}`);
    
    if (isNaN(sellerId)) {
      console.error("❌ [GET /api/seller/properties] Invalid seller ID received.");
      return res.status(400).json({ success: false, message: "Invalid seller ID" });
    }
    
    let conn;
    try {
      conn = await oracledb.getConnection(dbConfig);
      console.log("🟢 [GET /api/seller/properties] Database connection established.");
      
      const sqlQuery = `
          SELECT 
              ID, TITLE, LOCATION, RENT, DESCRIPTION, AMENITIES, PROS, CONS, IMAGES, 
              VIEWS, SAVED_COUNT, STATUS 
          FROM properties 
          WHERE SELLER_ID = :seller_id`;
      
      console.log("🔍 [GET /api/seller/properties] Executing SQL:", sqlQuery);
      
      const result = await conn.execute(sqlQuery, [sellerId]);
    
      console.log(`🟢 [GET /api/seller/properties] SQL query successful. Rows returned: ${result.rows.length}`);
      
      if (result.rows.length === 0) {
        console.log("⚠️ [GET /api/seller/properties] No properties found for this seller.");
      }
      
      const properties = result.rows.map(row => ({
        property_id: row.ID,
        title: row.TITLE,
        location: row.LOCATION,
        rent: row.RENT,
        description: row.DESCRIPTION,
        amenities: (row.AMENITIES || '').split(","),
        pros: (row.PROS || '').split(","),
        cons: (row.CONS || '').split(","),
        images: (row.IMAGES || '').split(","),
        views: row.VIEWS,
        saved_count: row.SAVED_COUNT,
        status: row.STATUS
      }));
    
      console.log("🟢 [GET /api/seller/properties] Sending JSON response.");
      res.json({
        success: true,
        properties: properties
      });
    } catch (err) {
      console.error("❌ [GET /api/seller/properties] DB Error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    } finally {
      if (conn) {
        try {
          await conn.close();
          console.log("ℹ️ [GET /api/seller/properties] Connection closed.");
        } catch (err) {
          console.error("❌ [GET /api/seller/properties] Error closing connection:", err);
        }
      }
    }
});

// 2. Route to Update Property Status
router.put("/properties/:id/status", async (req, res) => {
    console.log("🔍 [PUT /api/seller/properties/:id/status] Request received.");
    
    const propertyId = parseInt(req.params.id);
    const newStatus = req.body.status;
    
    console.log(`🔍 [PUT /api/seller/properties/:id/status] Property ID: ${propertyId}, New Status: ${newStatus}`);
    
    if (isNaN(propertyId) || !newStatus) {
      console.error("❌ [PUT /api/seller/properties/:id/status] Invalid request data.");
      return res.status(400).json({ success: false, message: "Invalid request data" });
    }
  
    let conn;
    try {
      conn = await oracledb.getConnection(dbConfig);
      
      const result = await conn.execute(
        `UPDATE properties SET status = :status WHERE id = :id`,
        [newStatus, propertyId],
        { autoCommit: true }
      );
      
      if (result.rowsAffected === 1) {
        console.log("🟢 [PUT /api/seller/properties/:id/status] Status updated successfully.");
        res.json({ success: true, message: "Status updated successfully" });
      } else {
        console.log("⚠️ [PUT /api/seller/properties/:id/status] Property not found or no changes made.");
        res.status(404).json({ success: false, message: "Property not found" });
      }
    } catch (err) {
      console.error("❌ [PUT /api/seller/properties/:id/status] DB Error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    } finally {
      if (conn) {
        try {
          await conn.close();
        } catch (err) {
          console.error("❌ [PUT /api/seller/properties/:id/status] Error closing connection:", err);
        }
      }
    }
});
  
// 3. Route to Delete a Property
router.delete("/properties/:id", async (req, res) => {
    console.log("🔍 [DELETE /api/seller/properties/:id] Request received.");
    
    const propertyId = parseInt(req.params.id);
    console.log(`🔍 [DELETE /api/seller/properties/:id] Property ID to delete: ${propertyId}`);
    
    if (isNaN(propertyId)) {
      console.error("❌ [DELETE /api/seller/properties/:id] Invalid property ID.");
      return res.status(400).json({ success: false, message: "Invalid property ID" });
    }
  
    let conn;
    try {
      conn = await oracledb.getConnection(dbConfig);
      
      const result = await conn.execute(
        `DELETE FROM properties WHERE id = :id`,
        [propertyId],
        { autoCommit: true }
      );
  
      if (result.rowsAffected === 1) {
        console.log("🟢 [DELETE /api/seller/properties/:id] Property deleted successfully.");
        res.json({ success: true, message: "Property deleted successfully" });
      } else {
        console.log("⚠️ [DELETE /api/seller/properties/:id] Property not found or no changes made.");
        res.status(404).json({ success: false, message: "Property not found" });
      }
    } catch (err) {
      console.error("❌ [DELETE /api/seller/properties/:id] DB Error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    } finally {
      if (conn) {
        try {
          await conn.close();
        } catch (err) {
          console.error("❌ [DELETE /api/seller/properties/:id] Error closing connection:", err);
        }
      }
    }
});
  
module.exports = router;