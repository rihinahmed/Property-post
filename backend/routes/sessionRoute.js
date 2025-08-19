router.get('/', async (req, res) => {
    const user = req.session.user;
  
    if (!user) {
      return res.json({ loggedIn: false });
    }
  
    let conn;
    try {
      conn = await oracledb.getConnection(dbConfig);
      const result = await conn.execute(
        `SELECT id, name, email, role, profile_img FROM users WHERE id = :id`,
        [user.id],
        { outFormat: oracledb.OUT_FORMAT_OBJECT } // <-- Added for consistency
      );
      await conn.close();
  
      const row = result.rows[0];
      if (!row) {
        return res.json({ loggedIn: false });
      }
  
      // CORRECTED LINE: Use object destructuring
      const { ID, NAME, EMAIL, ROLE, PROFILE_IMG } = row;
  
      req.session.user.profile_img = PROFILE_IMG; // Update session with latest image
  
      return res.json({
        loggedIn: true,
        user: {
          id: ID,
          name: NAME,
          email: EMAIL,
          role: ROLE,
          profile_img: PROFILE_IMG
        }
      });
    } catch (err) {
      console.error('❌ Session check error:', err);
      return res.status(500).json({ loggedIn: false });
    }
  });
  
  module.exports = router;