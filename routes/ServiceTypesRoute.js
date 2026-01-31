const express = require("express");
const router = express.Router();
const {
  addServiceType,
  updateServiceType,
  deleteServiceType,
  getAllServiceTypes,
  getOneServiceType,
} = require("../controller/ServiceTypesController.js");
const auth = require("../middleware/authMiddleware.js");

// Public routes
router.get("/allService", getAllServiceTypes);
router.get("/:id", getOneServiceType);

// Protected routes
router.post("/addService", addServiceType);
router.put("/update/:id", updateServiceType);
router.delete("/delete/:id", deleteServiceType);

module.exports = router;
