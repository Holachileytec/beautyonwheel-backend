const express = require("express");
const router = express.Router();
const {
  adminUpdateProfile,
  getAdmin,
  AdminPasscode,
} = require("../controller/AdminController.js");
const auth = require("../middleware/authMiddleware.js");
const { isAdmin } = require("../middleware/roleMiddleware.js");

// Protected admin-only routes
// Both auth (JWT verification) and isAdmin (role check) are required
router.get("/profile", auth, isAdmin, getAdmin);
router.put("/profile", auth, isAdmin, adminUpdateProfile);
router.post("/code", AdminPasscode);

module.exports = router;
