// server/controllers/user.controller.js

const User = require("../models/User.model");
const { sendEmail } = require("../utils/notification");
const { notifyUser } = require("../utils/notify");

// ======================================================
// PROFILE COMPLETION CONFIG
// ======================================================
const REQUIRED_FIELDS = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "gender",
  "date_of_birth",
];

// Check missing or empty fields
const getMissingFields = (user) =>
  REQUIRED_FIELDS.filter(
    (field) => !user[field] || String(user[field]).trim() === ""
  );

// ======================================================
// SEND WELCOME / PROFILE MAIL
// ======================================================
exports.sendWelcomeMail = async (user) => {
  try {
    if (!user?.email) return;

    const missingFields = getMissingFields(user);
    const isProfileComplete = missingFields.length === 0;

    // ===============================
    // FULL PROFILE → WELCOME MAIL
    // ===============================
    if (isProfileComplete) {
      if (user.welcomeMailSent) return; // avoid duplicates

      const subject = "🎉 Welcome to KaroFlight!";
      const html = `
        <div style="font-family:Arial,sans-serif;">
          <h2>Welcome, ${user.first_name || "User"}!</h2>
          <p>Your profile is complete — you can start booking flights right away.</p>
          <a href="${process.env.CLIENT_URL}/dashboard"
            style="background:#007bff;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;">
            Go to Dashboard
          </a>
          <p>✈️ Team KaroFlight</p>
        </div>
      `;

      await sendEmail(user.email, subject, html);

      user.welcomeMailSent = true;
      user.isProfileComplete = true;
      await user.save();

if (!updatedUser.profileCompletionNotified) {

await notifyUser({
  userId: user._id,
  title: "🎉 Welcome to KaroFlight!",
  message: "Your profile is complete. You can now book flights seamlessly.",
  type: "PROFILE",
  meta: {
    action: "PROFILE_COMPLETED"
  }
});
 updatedUser.profileCompletionNotified = true;
  await updatedUser.save();
}

      console.log(`📧 Welcome email sent to ${user.email}`);
      return;
    }

    // ===============================
    // INCOMPLETE PROFILE → REMINDER
    // ===============================
    const subject = "📝 Complete Your KaroFlight Profile";
    const fieldsList = missingFields
      .map((f) => `<li>${f.replace("_", " ")}</li>`)
      .join("");

    const html = `
      <div style="font-family:Arial,sans-serif;">
        <h2>Hi ${user.first_name || "there"} 👋</h2>
        <p>Please complete your profile to unlock all features:</p>
        <ul style="color:#e63946;">${fieldsList}</ul>
        <a href="${process.env.CLIENT_URL}/profile"
          style="background:#28a745;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;">
          Complete Profile
        </a>
        <p>– Team KaroFlight ✈️</p>
      </div>
    `;

    await sendEmail(user.email, subject, html);
    console.log(`📧 Profile reminder sent to ${user.email}`);


await notifyUser({
  userId: user._id,
  title: "📝 Complete Your Profile",
  message: "Complete your profile to unlock all KaroFlight features.",
  type: "PROFILE",
  meta: {
    missingFields
  }
});



  } catch (err) {
    console.error("❌ Welcome mail error:", err);
  }
};

// ======================================================
// GET LOGGED-IN USER PROFILE
// ======================================================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user)
      return res.status(404).json({
        success: false,
        message: "User not found",
      });

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching profile",
    });
  }
};

// ======================================================
// UPDATE PROFILE
// ======================================================
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...req.body,
        updated_at: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser)
      return res.status(404).json({
        success: false,
        message: "User not found",
      });

    // Check profile completion
    const missingFields = getMissingFields(updatedUser);

    if (missingFields.length === 0 && !updatedUser.isProfileComplete) {
      updatedUser.isProfileComplete = true;
      await updatedUser.save();

      const subject = "✅ Profile Completed Successfully!";
      const html = `
        <div style="font-family:Arial,sans-serif;">
          <h2>Hi ${updatedUser.first_name || "User"},</h2>
          <p>Your profile is now complete.</p>
          <a href="${process.env.CLIENT_URL}/dashboard"
            style="background:#007bff;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;">
            Go to Dashboard
          </a>
          <p>– Team KaroFlight ✈️</p>
        </div>
      `;

      await sendEmail(updatedUser.email, subject, html);

await notifyUser({
  userId: updatedUser._id,
  title: "✅ Profile Completed",
  message: "Your profile has been completed successfully.",
  type: "PROFILE",
  meta: {
    action: "PROFILE_COMPLETED"
  }
});



      console.log(`📧 Profile completion mail sent to ${updatedUser.email}`);
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating profile",
    });
  }
};

// ======================================================
// SAVE FCM TOKEN
// ======================================================
exports.saveFcmToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token)
      return res.status(400).json({
        success: false,
        message: "FCM token is required",
      });

    await User.findByIdAndUpdate(req.user.id, {
      fcmToken: token,
    });

    console.log("📲 FCM token saved for user:", req.user.id);

    res.json({
      success: true,
      message: "FCM token saved successfully",
    });
  } catch (error) {
    console.error("FCM Token Save Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to save FCM token",
    });
  }
};
