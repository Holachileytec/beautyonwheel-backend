const express = require("express");
const router = express.Router();
const { initializePayment } = require("../controller/initializePaymentController.js");
const { verifyPayment } = require("../controller/verifyPaymentController.js");
const auth = require("../middleware/authMiddleware.js");




const paystackController = require("../controller/PaymentController.js");
const Payment = require("../models/PaymentSchema.js");

// Paystack requires RAW body
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paystackController.paystackWebhook
);
// Payment routes
router.post("/initialize", auth, initializePayment);
router.get("/verify/:reference", auth, verifyPayment);

module.exports = router;
