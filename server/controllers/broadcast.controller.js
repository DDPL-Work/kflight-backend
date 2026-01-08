const Subscriber = require("../models/Subscriber.model");
const { sendEmail } = require("../utils/notification");

// ✅ Admin Broadcast
exports.broadcastEmail = async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message)
      return res.status(400).json({ success: false, message: "Subject and message required" });

    const subscribers = await Subscriber.find({ status: "active" });

    if (!subscribers.length)
      return res.status(400).json({ success: false, message: "No active subscribers" });

    for (const sub of subscribers) {
      await sendEmail(
        sub.email,
        subject,
        `<div style="font-family:Arial,sans-serif;">
          <h3>${subject}</h3>
          <p>${message}</p>
          <p>✈️ <a href="${process.env.CLIENT_URL}">Visit KaroFlight</a></p>
          <p>If you wish to unsubscribe, <a href="${process.env.CLIENT_URL}/unsubscribe?email=${sub.email}">click here</a>.</p>
        </div>`
      );
    }

    res.json({ success: true, message: `Broadcast sent to ${subscribers.length} subscribers` });
  } catch (error) {
    console.error("Broadcast Error:", error);
    res.status(500).json({ success: false, message: "Server error sending broadcast" });
  }
};
