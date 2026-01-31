const express = require("express");
const router = express.Router();
const {
  getClientProfile,
  updateClientProfile,
} = require("../controller/ClientController.js");
const auth = require("../middleware/authMiddleware.js");

// Protected routes
router.get("/profile", auth, getClientProfile);
router.put("/profile", auth, updateClientProfile);

module.exports = router;
