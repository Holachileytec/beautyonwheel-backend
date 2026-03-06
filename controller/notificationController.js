const Notification = require("../models/notificationSchema.js");

const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.userId,
    }).sort({ createdAt: -1 });

    // ✅ Always respond — empty array is valid
    res.status(200).json({
      message: "Notifications accessed successfully",
      notifications: notifications || [],
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Notifications could not be accessed", error });
  }
};
const markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;

    await Notification.findByIdAndUpdate(notificationId, {
      read: true,
    });

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Failed to mark notification", error });
  }
};
const createNotification = async (userId, title, message) => {
  try {
    const newNotification = new Notification({
      recipient: userId,
      title: title,
      message: message,
    });
    await newNotification.save();
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
};

module.exports = { getAllNotifications, markAsRead, createNotification };
