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

router.post("/loginA", adminLogin);
router.post("/logout",adminLogout)
router.post("/code", AdminPasscode);
router.post("/register", registerAdmin); // ← new route
router.get("/profile", auth, isAdmin, getAdmin);
router.put("/profile", auth, isAdmin, adminUpdateProfile);


module.exports = router;
