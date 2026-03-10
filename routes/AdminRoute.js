const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware.js");
const { isAdmin } = require("../middleware/roleMiddleware.js");
const {
  adminUpdateProfile,
  getAdmin,
  AdminPasscode,
  adminLogin,
  adminLogout,
  registerAdmin,
} = require("../controller/AdminController.js");

router.post("/api/admin/login", adminLogin);
router.post("/api/admin/logout", adminLogout);
router.post("/api/admin/code", AdminPasscode);
router.post("/api/admin/register", registerAdmin);
router.get("/profile", auth, isAdmin, getAdmin);
router.put("/profile", auth, isAdmin, adminUpdateProfile);

module.exports = router;
