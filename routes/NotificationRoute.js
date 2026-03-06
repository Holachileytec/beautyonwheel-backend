const express = require("express");
const router = express.Router();
const {
  getAllNotifications,
  createNotification,
  markAsRead,
} = require("../controller/notificationController.js");

router.get("/Notifications", getAllNotifications);
router.post("/Notifications", createNotification); // ← router.push doesn't exist, use router.post
router.get("/Notifications/read/:id", markAsRead); // ← missing leading slash

module.exports = router;
