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
router.post("/create",auth, createService);
router.put("/updateServ/:id", auth, updateService);
router.delete("/delete/:id",auth, deleteService);

module.exports = router;
