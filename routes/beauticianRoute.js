const express = require("express");
const router = express.Router();
const {
  getBeauticianProfile,
  getBeauticians,
  updateBeauticianProfile,
  addService,
  deleteBeautician,
} = require("../controller/BeauticianController.js");
const auth = require("../middleware/authMiddleware.js");

// Public routes
router.get("/allbeauticians", getBeauticians);

// Protected routes
router.put("/profile-update", auth, updateBeauticianProfile);
router.post("/add-service", auth, addService);
router.delete("/delete/:id", auth, deleteBeautician);
router.get("/beautician/:id", getBeauticianProfile);

module.exports = router;
