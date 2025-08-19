// routes/messageRoute.js

const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const dbConfig = require('../config/db');

// Configure Oracle DB for the router
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;

/**
 * @api {post} /api/messages Send a new message
 * @apiDescription Sends a new message from a sender to a recipient and saves it to the database.
 * @apiParam {Number} senderId The ID of the user sending the message.
 * @apiParam {Number} recipientId The ID of the user receiving the message.
 * @apiParam {String} messageText The content of the message.
 */
router.post("/", async (req, res) => {
    console.log("🔍 [POST /api/messages] Request received.");
    const { senderId, recipientId, messageText } = req.body;

    // Simple validation
    if (!senderId || !recipientId || !messageText) {
        console.error("❌ [POST /api/messages] Invalid request data.");
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        console.log("🟢 [POST /api/messages] Database connection established.");

        const sqlQuery = `
            INSERT INTO messages (ID, SENDER_ID, RECIPIENT_ID, MESSAGE_TEXT, SENT_AT)
            VALUES (messages_seq.NEXTVAL, :sender_id, :recipient_id, :message_text, CURRENT_TIMESTAMP)`;
        
        const binds = {
            sender_id: senderId,
            recipient_id: recipientId,
            message_text: messageText
        };
        
        const options = {
            autoCommit: true
        };

        const result = await conn.execute(sqlQuery, binds, options);
        
        if (result.rowsAffected === 1) {
            console.log("🟢 [POST /api/messages] Message inserted successfully.");
            res.status(201).json({ success: true, message: "Message sent successfully" });
        } else {
            console.error("❌ [POST /api/messages] Failed to insert message.");
            res.status(500).json({ success: false, message: "Failed to send message" });
        }
    } catch (err) {
        console.error("❌ [POST /api/messages] DB Error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    } finally {
        if (conn) {
            try { await conn.close(); } catch (err) { console.error(err); }
        }
    }
});

/**
 * @api {get} /api/messages/:id Get a user's messages
 * @apiDescription Fetches all unique conversations for a given user ID.
 * @apiParam {Number} id The ID of the user to fetch messages for.
 */
router.get("/:id", async (req, res) => {
    console.log("🔍 [GET /api/messages/:id] Request received.");
    const userId = parseInt(req.params.id, 10);
    
    // Simple validation
    if (isNaN(userId)) {
        console.error("❌ [GET /api/messages/:id] Invalid user ID.");
        return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        console.log("🟢 [GET /api/messages/:id] Database connection established.");

        const sqlQuery = `
            SELECT
                CASE
                    WHEN m.SENDER_ID = :user_id THEN m.RECIPIENT_ID
                    ELSE m.SENDER_ID
                END as partnerId,
                u.NAME as partnerName,
                u.PROFILE_IMG as partnerAvatar,
                MAX(m.SENT_AT) as lastMessageTime,
                (
                    SELECT MESSAGE_TEXT
                    FROM messages
                    WHERE ID = (
                        SELECT MAX(ID)
                        FROM messages
                        WHERE (SENDER_ID = :user_id AND RECIPIENT_ID = u.ID) OR (SENDER_ID = u.ID AND RECIPIENT_ID = :user_id)
                    )
                ) as lastMessageText
            FROM
                messages m
            JOIN
                users u
            ON
                u.ID = CASE
                            WHEN m.SENDER_ID = :user_id THEN m.RECIPIENT_ID
                            ELSE m.SENDER_ID
                        END
            WHERE
                m.SENDER_ID = :user_id OR m.RECIPIENT_ID = :user_id
            GROUP BY
                CASE
                    WHEN m.SENDER_ID = :user_id THEN m.RECIPIENT_ID
                    ELSE m.SENDER_ID
                END,
                u.NAME,
                u.PROFILE_IMG
            ORDER BY
                lastMessageTime DESC
        `;
        
        const binds = { user_id: userId };
        const result = await conn.execute(sqlQuery, binds);

        const messages = result.rows.map(row => ({
            id: row.PARTNERID,
            name: row.PARTNERNAME,
            avatar: row.PARTNERAVATAR || 'https://i.pravatar.cc/40?img=10', // Default avatar
            lastMessage: row.LASTMESSAGETEXT,
            chatHistory: [] // We'll fill this in with another call later
        }));
        
        console.log("🟢 [GET /api/messages/:id] Messages fetched successfully.");
        res.status(200).json({ success: true, data: messages });
    } catch (err) {
        console.error("❌ [GET /api/messages/:id] DB Error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    } finally {
        if (conn) {
            try { await conn.close(); } catch (err) { console.error(err); }
        }
    }
});

module.exports = router;
