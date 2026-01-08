const User = require("../models/User.model");
const OTP = require("../models/otp.model");
const bcrypt = require("bcryptjs");
const { sendEmail, sendSMS } = require("../utils/notification");

// ========================= Forgot Password =========================
const sendForgotPasswordOTP = async (req, res) => {
  try {
    const { email, phone } = req.body;
    if (!email && !phone)
      return res.status(400).json({ message: "Email or phone required" });

    const user = await User.findOne({ $or: [{ email }, { phone }] });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await OTP.create({ email, phone, otp, purpose: "password_reset", expiresAt });

    if (email)
      await sendEmail(
        email,
        "Password Reset OTP",
        `Your OTP is <b>${otp}</b> and is valid for 10 minutes.`
      );
    if (phone)
      await sendSMS(phone, `Your OTP for password reset is ${otp}`);

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================= Verify OTP and Set New Password =========================
const verifyForgotPasswordOTP = async (req, res) => {
  try {
    const { email, phone, otp, new_password } = req.body;
    if (!otp || !new_password)
      return res
        .status(400)
        .json({ message: "OTP and new password required" });

    const record = await OTP.findOne({
      $or: [{ email }, { phone }],
      otp,
      purpose: "password_reset",
    });
    if (!record || record.expiresAt < new Date())
      return res.status(400).json({ message: "Invalid or expired OTP" });

    const user = await User.findOne({ $or: [{ email }, { phone }] });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Hash & save new password
    user.password = await bcrypt.hash(new_password, 10);
    await user.save();

    record.verified = true;
    await record.save();

    // ✅ Send confirmation email
    if (user.email) {
      await sendEmail(
        user.email,
        "Your Password Has Been Changed",
        `
        <p>Hi ${user.name || "User"},</p>
        <p>Your password has been changed successfully.</p>
        <p>If you did not make this change, please reset your password immediately or contact support.</p>
        <br/>
        <p>Regards,<br/>Karo Flight</p>
        `
      );
    }

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================= Reset Password for Logged-in User =========================
const resetPasswordWithOldPassword = async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(old_password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Old password is incorrect" });

    user.password = await bcrypt.hash(new_password, 10);
    await user.save();

    // ✅ Send confirmation email
    if (user.email) {
      await sendEmail(
        user.email,
        "Your Password Has Been Changed",
        `
        <p>Hi ${user.name || "User"},</p>
        <p>Your account password was changed successfully.</p>
        <p>If you did not perform this action, please reset your password immediately or contact our support team.</p>
        <br/>
        <p>Regards,<br/>Your App Team</p>
        `
      );
    }

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPasswordWithOldPassword,
};
