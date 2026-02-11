const Notification = require("../models/notificationSchema.js");

const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.userId,
    }).sort({ createdAt: -1 });
    if (!notifications || notifications.length === 0) return;
    res
      .status(200)
      .json({ message: "Notification Accessed successfully", notifications });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Notifications could not be accessed", error: error });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.status(200).json({ message: "Notification marked as read!" });
  } catch (err) {
    res.status(500).json({ message: "Notification not updated!" });
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
