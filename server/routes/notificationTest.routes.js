const express = require("express");
const router = express.Router();
const { notifyUser } = require("../utils/notify");

// TEMP route — FOR TESTING IN POSTMAN ONLY
router.post("/test", async (req, res) => {
  try {
    const { userId, staffId, title, message, type, meta } = req.body;

    await notifyUser({
      userId,
      staffId,
      title,
      message,
      type,
      meta,
    });

    res.json({
      success: true,
      message: "Test notification created successfully"
    });
  } catch (err) {
    console.error("Test Notification Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create test notification"
    });
  }
});

module.exports = router;
