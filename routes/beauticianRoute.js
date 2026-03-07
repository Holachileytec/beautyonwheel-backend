const express = require("express");
const router = express.Router();
const {
  getBeauticianProfile,
  getBeauticians,
  updateBeauticianProfile,
  getBeauticianByUserId,
  updateBeautician,
  addService,
  deleteBeautician,
} = require("../controller/BeauticianController.js");
const auth = require("../middleware/authMiddleware.js");
const {
  getAllGalleryItems,
  beauticianUploadJob,
} = require("../controller/beauticianUploadJobController.js");
const localUpload = require("../middleware/adminUpload.js");

// Public routes
router.get("/allbeauticians", getBeauticians);
router.get("/user/:userId", getBeauticianByUserId);

// Protected routes
router.put("/profile-update", auth, updateBeauticianProfile);
router.post("/add-service", auth, addService);
router.post("/uploadpic", beauticianUploadJob);
router.get("/getAllGallery", localUpload.single("image"), getAllGalleryItems);
router.delete("/delete/:id", auth, deleteBeautician);
router.get("/:id", getBeauticianProfile);
router.put("/Bupdate/:id", updateBeautician);

module.exports = router;
