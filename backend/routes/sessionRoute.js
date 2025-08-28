router.get('/', async (req, res) => {
  // 1. Check if a session exists first.
  const user = req.session.user;
  if (!user) {
      // If no user is in the session, they are not logged in.
      return res.json({ loggedIn: false });
  }

  let conn; // Declare the connection variable outside the try block
  try {
      // 2. Get a new connection from the database pool.
      conn = await oracledb.getConnection(dbConfig);
      
      // 3. Execute the query to retrieve user details. Using bind variables protects against SQL injection.
      const result = await conn.execute(
          `SELECT id, name, email, role, profile_img FROM users WHERE id = :id`,
          [user.id],
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      // 4. Check if a user was found in the database.
      const row = result.rows[0];
      if (!row) {
          // If the user's data is not found, clear the session and return not logged in.
          return res.json({ loggedIn: false });
      }
      
      // 5. Destructure the row, which will have uppercase keys from Oracle.
      const { ID, NAME, EMAIL, ROLE, PROFILE_IMG } = row;
      
      // 6. Update the session with the latest profile image URL (if it's changed).
      req.session.user.profile_img = PROFILE_IMG; 
      
      // 7. Return the successful response with the user's data.
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
      // 8. Log the detailed error for server-side debugging.
      console.error('❌ Session check error:', err);
      // 9. Return a generic 500 status to the client.
      return res.status(500).json({ loggedIn: false, message: 'Server error during session check.' });
  } finally {
      // 10. CRITICAL STEP: Always close the database connection to prevent resource leaks.
      // This block will execute whether the try block succeeds or a catch block handles an error.
      if (conn) {
          try {
              await conn.close();
          } catch (closeErr) {
              console.error('❌ Error closing connection:', closeErr);
          }
      }
  }
});
