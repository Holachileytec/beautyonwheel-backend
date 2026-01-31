const express = require("express");
const router = express.Router();
const { initializePayment } = require("../controller/initializePaymentController.js");
const { verifyPayment } = require("../controller/verifyPaymentController.js");
const auth = require("../middleware/authMiddleware.js");

// Payment routes
router.post("/initialize", auth, initializePayment);
router.get("/verify/:reference", auth, verifyPayment);

module.exports = router;
