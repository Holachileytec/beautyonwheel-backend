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
router.get("/:id", getBeauticianProfile);

// Protected routes
router.put("/profile-update", auth, updateBeauticianProfile);
router.post("/add-service", auth, addService);
router.delete("/delete/:id", deleteBeautician);

module.exports = router;
