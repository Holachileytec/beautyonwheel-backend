const express = require("express");
const router = express.Router();
const {
  deleteBooking,
  updateBooking,
  createBooking,
  getSingleBooking,
  allBookings,
} = require("../controller/BookingController.js");
const auth = require("../middleware/authMiddleware.js");

// All booking routes require authentication
router.post("/create", auth, createBooking);
router.get("/all", auth, allBookings);
router.get("/:id", auth, getSingleBooking);
router.put("/:id", auth, updateBooking);
router.delete("/:id", auth, deleteBooking);

module.exports = router;
