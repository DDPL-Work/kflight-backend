const router = require("express").Router();
const { verifyAdmin } = require("../middlewares/auth");
const Campaign = require("../models/Campaign.model");
const Newsletter = require("../models/Newsletter.model");
const Subscription = require("../models/Subscription.model");
const { sendEmail } = require("../utils/notification");

// POST /api/admin/send-now/:campaignId
router.post("/send-now/:campaignId", verifyAdmin, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    const newsletter = await Newsletter.findOne({ campaignId: campaign._id });
    if (!newsletter) return res.status(400).json({ message: "No newsletter defined" });

    const subscribers = await Subscription.find({ status: "active" });
    for (const s of subscribers) {
      try {
        await sendEmail(s.email, newsletter.title, newsletter.body);
      } catch (err) {
        console.error("Send error", err.message);
      }
    }

    campaign.schedule.isSent = true;
    campaign.status = "sent";
    await campaign.save();

    return res.json({ message: "Campaign triggered manually", sentTo: subscribers.length });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
