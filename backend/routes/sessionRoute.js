const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const dbConfig = require('../config/db');

router.get('/', async (req, res) => {
  const user = req.session.user;

  if (!user) {
    return res.json({ loggedIn: false });
  }

  try {
    const conn = await oracledb.getConnection(dbConfig);
    const result = await conn.execute(
      `SELECT id, name, email, role, profile_img FROM users WHERE id = :id`,
      [user.id]
    );
    await conn.close();

    const row = result.rows[0];
    if (!row) {
      return res.json({ loggedIn: false });
    }

    const [id, name, email, role, profile_img] = row;

    req.session.user.profile_img = profile_img; // update session with latest image

    return res.json({
      loggedIn: true,
      user: {
        id,
        name,
        email,
        role,
        profile_img
      }
    });
  } catch (err) {
    console.error('❌ Session check error:', err);
    return res.status(500).json({ loggedIn: false });
  }
});

module.exports = router;
