const cron = require("node-cron");
const Campaign = require("../models/Campaign.model");
const Subscription = require("../models/Subscription.model");
const { sendEmail } = require("./notification");

// Check every minute for scheduled campaigns
cron.schedule("*/1 * * * *", async () => {
  try {
    const now = new Date();
    const dueCampaigns = await Campaign.find({
      "scheduleDate.date": { $lte: now },
      "scheduleDate.isSent": false,
      status: "scheduled"
    });

    for (const campaign of dueCampaigns) {
      console.log(`🔔 Sending campaign: ${campaign.name}`);

      const subscribers = await Subscription.find({ status: "active" });
      if (!subscribers.length) {
        console.warn("⚠️ No active subscribers found");
        campaign.scheduleDate.isSent = true;
        campaign.status = "sent";
        await campaign.save();
        continue;
      }

      let success = 0, failed = 0;

      for (const sub of subscribers) {
        try {
          await sendEmail({
            to: sub.email,
            subject: campaign.subject,
            html: campaign.message
          });
          success++;
        } catch (err) {
          console.error(`❌ Failed for ${sub.email}: ${err.message}`);
          failed++;
        }
      }

      campaign.scheduleDate.isSent = true;
      campaign.status = "sent";
      campaign.stats = { total: subscribers.length, success, failed };
      await campaign.save();

      console.log(`✅ Campaign "${campaign.name}" sent to ${success}/${subscribers.length}`);
    }
  } catch (err) {
    console.error("Scheduler Error:", err.message);
  }
});
