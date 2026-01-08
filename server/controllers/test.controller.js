// controllers/test.controller.js

const { sendOTPTest } = require("../utils/sendTestSMS");

exports.testSMS = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    // ✅ Generate dynamic 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // ✅ Send OTP using 2Factor
    await sendOTPTest(mobile, otp);

    res.json({
      success: true,
      message: "OTP sent successfully for testing",
      otp, // ⚠️ Only for testing — REMOVE in production
    });
  } catch (error) {
    console.error("❌ Test SMS Controller Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to send test OTP",
    });
  }
};
