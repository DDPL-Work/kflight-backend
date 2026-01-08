const mongoose = require("mongoose");
const Notification = require("../models/Notification.model");

// ======================================================
// GET MY NOTIFICATIONS (Paginated)
// ======================================================
exports.getMyNotifications = async (req, res) => {
  try {
    const filter = req.staff
      ? { staffId: req.staff._id }
      : { userId: req.user._id };

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);

    const notifications = await Notification.find(filter)
      .select("title message type meta isRead createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const unreadCount = await Notification.countDocuments({
      ...filter,
      isRead: false,
    });

    res.json({
      success: true,
      page,
      limit,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
};

// ======================================================
// MARK SINGLE AS READ
// ======================================================
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const filter = req.staff
      ? { _id: id, staffId: req.staff._id }
      : { _id: id, userId: req.user._id };

    const notification = await Notification.findOneAndUpdate(
      filter,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    res.json({ success: true, message: "Marked as read" });
  } catch (error) {
    console.error("MARK READ ERROR:", error);
    res.status(500).json({ success: false, message: "Failed" });
  }
};

// ======================================================
// MARK ALL AS READ
// ======================================================
exports.markAllAsRead = async (req, res) => {
  try {
    const filter = req.staff
      ? { staffId: req.staff._id, isRead: false }
      : { userId: req.user._id, isRead: false };

    await Notification.updateMany(filter, { isRead: true });

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("MARK ALL ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to update notifications" });
  }
};

// ======================================================
// DELETE SINGLE
// ======================================================
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const filter = req.staff
      ? { _id: id, staffId: req.staff._id }
      : { _id: id, userId: req.user._id };

    const deleted = await Notification.findOneAndDelete(filter);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    res.json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to delete notification" });
  }
};

// ======================================================
// DELETE ALL
// ======================================================
exports.deleteAllNotifications = async (req, res) => {
  try {
    const filter = req.staff
      ? { staffId: req.staff._id }
      : { userId: req.user._id };

    await Notification.deleteMany(filter);

    res.json({ success: true, message: "All notifications deleted successfully" });
  } catch (error) {
    console.error("DELETE ALL ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to delete notifications" });
  }
};
