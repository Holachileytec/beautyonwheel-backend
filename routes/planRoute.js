const express = require("express");
const router = express.Router();
const {
  createPlan,
  getAllPlans,
  updatePlan,
  deletePlan,
} = require("../controller/planController.js");
const auth = require("../middleware/authMiddleware.js");

// Public routes
router.get("/allPlans", getAllPlans);

// Protected routes
router.post("/addplan", createPlan);
router.put("/update/:id", auth, updatePlan);
router.delete("/:id", deletePlan);

module.exports = router;
