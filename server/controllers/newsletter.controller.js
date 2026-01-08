const Newsletter = require("../models/Newsletter.model");
const Campaign = require("../models/Campaign.model");

// create newsletter under campaign
exports.createNewsletter = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    const newsletter = await Newsletter.create({
      campaignId,
      title: req.body.title,
      body: req.body.body,
      images: req.body.images || [],
      createdBy: req.user._id
    });

    return res.status(201).json({ message: "Newsletter created", newsletter });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getNewslettersByCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const newsletters = await Newsletter.find({ campaignId }).sort({ createdAt: -1 });
    return res.json(newsletters);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
