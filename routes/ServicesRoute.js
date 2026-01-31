const express = require("express");
const router = express.Router();
const {
  createService,
  getAllServices,
  getSingleService,
  updateService,
  deleteService,
} = require("../controller/ServicesController.js");
const auth = require("../middleware/authMiddleware.js");

// Public routes
router.get("/all", getAllServices);
router.get("/:id", getSingleService);

// Protected routes (admin/beautician)
router.post("/create", createService);
router.put("/updateServ/:id", auth, updateService);
router.delete("/delete/:id", deleteService);

module.exports = router;
