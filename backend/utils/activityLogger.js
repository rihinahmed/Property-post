// Create this file: utils/activityLogger.js
const oracledb = require('oracledb');

const dbConfig = {
    user: "SYSTEM",
    password: "Rihin1234",
    connectString: "localhost/XEPDB1"
};

/**
 * Log user activity to the database
 * @param {number} userId - User ID
 * @param {string} activityType - Type of activity
 * @param {string} status - Status of activity
 * @param {string} details - Additional details
 */
async function logActivity(userId, activityType, status = 'Success', details = '') {
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        await conn.execute(
            `INSERT INTO ACTIVITY_LOG (USER_ID, ACTIVITY_TYPE, STATUS, DETAILS) 
             VALUES (:userId, :activityType, :status, :details)`,
            { userId, activityType, status, details },
            { autoCommit: true }
        );
        
        console.log(`✅ Activity logged: ${activityType} - ${status} for user ${userId}`);
    } catch (err) {
        console.error(`❌ Error logging activity:`, err.message);
        // Don't throw error - logging shouldn't break main functionality
    } finally {
        if (conn) {
            try { await conn.close(); } catch (err) { console.error(err); }
        }
    }
}

/**
 * Activity Types - Use these constants for consistency
 */
const ACTIVITY_TYPES = {
    // Authentication
    LOGIN: 'Login',
    LOGOUT: 'Logout',
    SIGNUP: 'User Registration',
    
    // Property Management
    PROPERTY_LISTED: 'Property Listed',
    PROPERTY_UPDATED: 'Property Updated',
    PROPERTY_DELETED: 'Property Deleted',
    PROPERTY_VIEWED: 'Property Viewed',
    
    // Room Management
    ROOM_SAVED: 'Room Saved',
    ROOM_UNSAVED: 'Room Unsaved',
    
    // Blog
    BLOG_CREATED: 'Blog Post Created',
    BLOG_UPDATED: 'Blog Post Updated',
    BLOG_DELETED: 'Blog Post Deleted',
    
    // Messaging
    MESSAGE_SENT: 'Message Sent',
    MESSAGE_READ: 'Message Read',
    
    // Profile
    PROFILE_UPDATED: 'Profile Updated',
    PROFILE_PICTURE_UPDATED: 'Profile Picture Updated',
    
    // Search & Browse
    SEARCH_PERFORMED: 'Search Performed',
    PAGE_VISITED: 'Page Visited',
    
    // System
    DASHBOARD_ACCESSED: 'Dashboard Accessed',
    SYSTEM_EVENT: 'System Event'
};

/**
 * Status Types - Use these constants for consistency
 */
const STATUS_TYPES = {
    SUCCESS: 'Success',
    FAILED: 'Failed',
    PENDING: 'Pending',
    COMPLETED: 'Completed',
    ERROR: 'Error',
    WARNING: 'Warning',
    INFO: 'Info'
};

module.exports = {
    logActivity,
    ACTIVITY_TYPES,
    STATUS_TYPES
};

