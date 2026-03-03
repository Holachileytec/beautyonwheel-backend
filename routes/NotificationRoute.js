
import {
  getAllNotifications,
  markAsRead,
  createNotification,
} from "../routes/NotificationRoute.js";

const express = require("express");
const router = express.Router();

router.get("/allNotication", getAllNotifications);
router.push("/create", createNotification);
router.get("read", markAsRead);

module.exports = router;
