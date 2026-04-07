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
  adminCreateCodes,
  getAllCodes,
} = require("../controller/AdminController.js");
const {
  getAllAdminGalleryItems,
  AdminSubmitJob,
  deleteAdminGalleryItem,
} = require("../controller/adminUploadJobController.js");
const localUpload = require("../middleware/adminUpload.js");

router.post("/login", adminLogin);
router.post("/logout", adminLogout);
router.post("/code", AdminPasscode); //
router.post("/register", registerAdmin);
router.get("/profile", auth, isAdmin, getAdmin);
router.put("/profile", auth, isAdmin, adminUpdateProfile);
router.get("/getAdminImg", getAllAdminGalleryItems);
router.post("/uploadAJob", localUpload.single("AImage"), AdminSubmitJob);
router.delete("/deletAJob/:id", deleteAdminGalleryItem);
router.post("/generateCodes", adminCreateCodes);
router.get("/allCodes", getAllCodes);

module.exports = router;
