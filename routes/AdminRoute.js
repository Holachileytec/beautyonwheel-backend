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

router.post("/admin/login", adminLogin);
router.post("/admin/logout",adminLogout)
router.post("/admin/code", AdminPasscode);
router.post("/admin/register", registerAdmin); // ← new route
router.get("/admin/profile", auth, isAdmin, getAdmin);
router.put("/admin/profile", auth, isAdmin, adminUpdateProfile);


module.exports = router;
