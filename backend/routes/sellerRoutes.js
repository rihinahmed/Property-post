const express = require("express");
const router = express.Router();
const { getSellerProperties } = require("../controllers/propertyController");
const { requireSeller } = require("../middlewares/authMiddleware");

router.get("/properties", requireSeller, getSellerProperties);

module.exports = router;
