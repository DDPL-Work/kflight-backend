const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notification.controller");
const { verifyUserOrStaff } = require("../middlewares/auth");

// ======================================================
// ALL NOTIFICATION ROUTES (USER OR STAFF)
// ======================================================
router.use(verifyUserOrStaff);

// GET /api/notifications?page=1&limit=20
router.get("/", notificationController.getMyNotifications);

// PATCH /api/notifications/read-all
router.patch("/read-all", notificationController.markAllAsRead);

// PATCH /api/notifications/:id/read
router.patch("/:id/read", notificationController.markAsRead);

// DELETE /api/notifications
router.delete("/", notificationController.deleteAllNotifications);

// DELETE /api/notifications/:id
router.delete("/:id", notificationController.deleteNotification);

module.exports = router;
