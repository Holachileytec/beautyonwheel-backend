const express = require("express");
const router = express.Router();
const {
  getAllNotifications,
  createNotification,
  markAsRead,
} = require("../controller/notificationController.js");

router.get("/", getAllNotifications);
router.post("/", createNotification);
router.get("/read/:id", markAsRead);

module.exports = router;
