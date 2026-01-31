const express = require("express");
const router = express.Router();
const {
  createSubscription,
  getAllSubscriptions,
  getUserSubscription,
  getSubscriptionById,
  updateSubscription,
  cancelSubscription,
  deleteSubscription,
  checkExpiredSubscriptions,
} = require("../controller/subscriptionController.js");
const auth = require("../middleware/authMiddleware.js");

// Protected routes - User
router.post("/create", auth, createSubscription);
router.get("/my-subscription", auth, getUserSubscription);

// Protected routes - Admin
router.get("/all", auth, getAllSubscriptions);
router.get("/:id", auth, getSubscriptionById);
router.put("/update/:id", auth, updateSubscription);
router.put("/cancel/:id", auth, cancelSubscription);
router.delete("/delete/:id", auth, deleteSubscription);

// Admin utility - check and deactivate expired subscriptions
router.post("/check-expired", auth, checkExpiredSubscriptions);

module.exports = router;
