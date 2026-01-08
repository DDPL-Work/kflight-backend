
// notify.js
const admin = require("../config/firebase");
const Notification = require("../models/Notification.model");
const User = require("../models/User.model");
const Staff = require("../models/staff.model");

exports.notifyUser = async ({
  userId = null,
  staffId = null,
  title,
  message,
  type = "SYSTEM",
  meta = {}
}) => {
  try {
    // 1️⃣ Save in-app notification
    await Notification.create({
      userId,
      staffId,
      title,
      message,
      type,
      meta
    });

    // 2️⃣ Push to USER
    if (userId) {
      const user = await User.findById(userId).select("fcmToken");
      if (user?.fcmToken) {
        await admin.messaging().send({
          token: user.fcmToken,
          notification: { title, body: message },
          data: stringifyMeta(meta),
        });
      }
    }

    // 3️⃣ Push to STAFF
    if (staffId) {
      const staff = await Staff.findById(staffId).select("fcmToken");
      if (staff?.fcmToken) {
        await admin.messaging().send({
          token: staff.fcmToken,
          notification: { title, body: message },
          data: stringifyMeta(meta),
        });
      }
    }

  } catch (err) {
    console.error("Notification Error:", err.message);
  }
};

const stringifyMeta = (meta) =>
  Object.fromEntries(Object.entries(meta).map(([k, v]) => [k, String(v)]));
