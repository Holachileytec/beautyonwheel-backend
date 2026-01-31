const express = require("express");
const router = express.Router();
const {
  adminUpdateProfile,
  getAdmin,
} = require("../controller/AdminController.js");
const auth = require("../middleware/authMiddleware.js");

// Protected routes
router.get("/profile", auth, getAdmin);
router.put("/profile", auth, adminUpdateProfile);

module.exports = router;
