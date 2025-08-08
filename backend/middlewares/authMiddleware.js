function requireSeller(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === "seller") {
      next();
    } else {
      res.status(403).json({ success: false, message: "Access denied. Seller only." });
    }
  }
  
  module.exports = { requireSeller };
  