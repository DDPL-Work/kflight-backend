// controllers/subscription.controller.js


const Subscription = require("../models/Subscription.model");
const User = require("../models/User.model");
const { sendEmail, sendSMS } = require("../utils/notification");
const { notifyUser } = require("../utils/notify");

// ===============================
// Check subscription status
// ===============================
exports.checkSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user._id; // From auth middleware

    const subscription = await Subscription.findOne({
      userId,
      status: "active"
    });

    if (subscription) {
      return res.status(200).json({
        success: true,
        isSubscribed: true,
        email: subscription.email,
        subscribedAt: subscription.subscribedAt,
      });
    }

    res.status(200).json({
      success: true,
      isSubscribed: false,
    });
  } catch (error) {
    console.error('Check subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check subscription status',
    });
  }
};

// ===============================
// Subscribe user
// ===============================
exports.subscribeUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("name email phone");
    if (!user) return res.status(404).json({ message: "User not found" });

    const existing = await Subscription.findOne({ userId: req.user._id });

    if (existing && existing.status === "active") {
      return res.status(400).json({ message: "Already subscribed" });
    }

    if (existing && existing.status === "unsubscribed") {
      existing.status = "active";
      existing.subscribedAt = new Date();
      await existing.save();

      await sendEmail({
        to: user.email,
        subject: "Subscription Reactivated 🎉",
        html: `<p>Hello ${user.name || "Subscriber"},</p>
               <p>Your subscription has been reactivated successfully.</p>`,
      });

      return res.json({ message: "Resubscribed and message sent", sub: existing });
    }

    const sub = await Subscription.create({
      userId: req.user._id,
      email: user.email,
    });

    await sendEmail({
      to: user.email,
      subject: "Welcome to Our Notification Service 🎉",
      html: `<p>Hello ${user.name || "Subscriber"},</p>
             <p>Thank you for subscribing! You will now receive updates.</p>`,
    });

    // if (user.phone) {
    //   await sendSMS(user.phone, "Thank you for subscribing! You will now receive updates.");
    // }
await notifyUser({
  userId: user._id,
  title: "Subscription Activated",
  message: "You have subscribed successfully!",
  type: "SUBSCRIPTION"
});

    return res.status(201).json({ message: "Subscribed and message sent", sub });
  } catch (err) {
    console.error("Subscription Error:", err);
    return res.status(500).json({ message: err.message });
  }
};

// ===============================
// Unsubscribe user
// ===============================
exports.unsubscribeUser = async (req, res) => {
  try {
    const sub = await Subscription.findOneAndUpdate(
      { userId: req.user._id, status: "active" },
      { status: "unsubscribed" },
      { new: true }
    );
    if (!sub) return res.status(400).json({ message: "No active subscription found" });

    const user = await User.findById(req.user._id);
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: "You have unsubscribed",
        html: `<p>Hello ${user.name || "Subscriber"},</p>
               <p>You have been unsubscribed successfully. You can rejoin anytime.</p>`,
      });
    }
await notifyUser({
  userId: user._id,
  title: "Unsubscribed",
  message: "You have unsubscribed from notifications.",
  type: "SUBSCRIPTION"
});

    return res.json({ message: "Unsubscribed and confirmation sent", sub });
  } catch (err) {
    console.error("Unsubscribe Error:", err);
    return res.status(500).json({ message: err.message });
  }
};

// ===============================
// Get all subscribers (admin)
// ===============================
exports.getAllSubscribers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;

    const query = { status: "active" };

    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      const userIds = users.map(u => u._id);
      query.userId = { $in: userIds };
    }

    const subs = await Subscription.find(query)
      .populate("userId", "name email phone")
      .sort({ subscribedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Subscription.countDocuments(query);

    return res.json({
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      subscribers: subs,
    });
  } catch (err) {
    console.error("Get All Subscribers Error:", err);
    return res.status(500).json({ message: err.message });
  }
};
