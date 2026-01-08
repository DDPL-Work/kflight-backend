// routes/firebaseTest.js
const express = require("express");
const admin = require("../config/firebase");
const router = express.Router();

router.post("/send-test-fcm", async (req, res) => {
  try {
    const { token } = req.body;

    const message = {
      notification: {
        title: "Test Notification",
        body: "Firebase is working!"
      },
      token
    };

    const response = await admin.messaging().send(message);
    res.json({ success: true, response });
  } catch (err) {
    console.error("FCM Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
