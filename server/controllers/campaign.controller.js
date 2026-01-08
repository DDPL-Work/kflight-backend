const Campaign = require("../models/Campaign.model");
const Subscription = require("../models/Subscription.model");
const { notifyUser } = require("../utils/notify");
const { sendEmail, sendSMS } = require("../utils/notification");

// Create campaign (SEO/Admin)
exports.createCampaign = async (req, res) => {
  try {
    const userRole = req.staff.role.toLowerCase();

    // Only Super Admin can schedule while creating
    const isScheduling =
      req.body.scheduleDate?.date && userRole !== "superadmin";

    if (isScheduling) {
      return res.status(403).json({
        message: "Only Super Admin can schedule campaigns",
      });
    }

    // Determine initial status
    // let initialStatus = ;
    if (req.body.scheduleDate?.date && userRole === "superadmin") {
      initialStatus = "scheduled";
    }

    const payload = {
      name: req.body.name,
      type: req.body.type || "custom",
      subject: req.body.subject,
      message: req.body.message,
      attachments: req.body.attachments || [],
      target: req.body.target || {},
      scheduleDate: req.body.scheduleDate || {},
      status: req.body.status || "draft",
      createdBy: req.staff._id,
    };

    const campaign = await Campaign.create(payload);
    await notifyUser({
      staffId: req.staff._id,
      title: "Campaign Created",
      message: `Campaign "${payload.name}" created successfully.`,
      type: "CAMPAIGN",
      meta: { campaignId: campaign._id }
    });

    return res.status(201).json({ message: "Campaign created", campaign });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Failed to create campaign", error: err.message });
  }
};

// Get all campaigns
exports.getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .populate("createdBy", "username email role")
      .populate("approvedBy", "username email")
      .sort({ createdAt: -1 });
    return res.json(campaigns);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Get campaigns pending approval (Super Admin only)
exports.getPendingCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ status: "pending_approval" })
      .populate("createdBy", "username email role")
      .sort({ createdAt: -1 });
    return res.json(campaigns);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Get campaign by ID
exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate("createdBy", "username email role")
      .populate("approvedBy", "username email");

    if (!campaign)
      return res.status(404).json({ message: "Campaign not found" });
    return res.json(campaign);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Update campaign
exports.updateCampaign = async (req, res) => {
  try {
    const userRole = req.staff.role.toLowerCase();
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const updateData = { ...req.body };

    // SEO editing a rejected campaign -> change to pending_approval
    if (userRole === "seo" && campaign.status === "rejected") {
      updateData.status = "pending_approval";
      updateData.rejectionReason = ""; // Clear rejection reason

      // Notify Super Admin
      await pushNotification({
        staffId: req.staff._id,
        title: "Campaign Resubmitted",
        message: `Campaign "${campaign.name}" has been resubmitted for approval.`,
        type: "campaign",
        meta: { campaignId: campaign._id },
      });
    }

    // Handle scheduleDate properly
    if (updateData.status === "scheduled" && updateData.scheduleDate?.date) {
      updateData.scheduleDate = {
        date: updateData.scheduleDate.date,
        isSent:
          updateData.scheduleDate.isSent !== undefined
            ? updateData.scheduleDate.isSent
            : false,
      };
      updateData.status = "scheduled";
    } else if (
      updateData.status !== "scheduled" &&
      updateData.status !== "sent"
    ) {
      // Remove scheduleDate if status is not scheduled/sent
      updateData.$unset = { scheduleDate: "" };
      delete updateData.scheduleDate;
    }

    const updated = await Campaign.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("createdBy", "username email role")
      .populate("approvedBy", "username email");

    return res.json({
      message: "Campaign updated successfully",
      updated,
    });
  } catch (err) {
    console.error("Update Campaign Error:", err);
    return res.status(500).json({
      message: "Failed to update campaign",
      error: err.message,
    });
  }
};

// Submit campaign for approval (SEO)
exports.submitForApproval = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    if (campaign.status !== "draft" && campaign.status !== "rejected") {
      return res.status(400).json({
        message:
          "Only draft or rejected campaigns can be submitted for approval",
      });
    }

    campaign.status = "pending_approval";
    campaign.rejectionReason = ""; // Clear any previous rejection reason
    await campaign.save();

    await pushNotification({
      staffId: req.staff._id,
      title: "Campaign Submitted",
      message: `Campaign "${campaign.name}" submitted for approval.`,
      type: "campaign",
      meta: { campaignId: campaign._id },
    });

    return res.json({
      message: "Campaign submitted for approval",
      campaign,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Failed to submit campaign",
      error: err.message,
    });
  }
};

// Approve campaign (Super Admin only)
exports.approveCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    if (campaign.status !== "pending_approval") {
      return res.status(400).json({
        message: "Only pending campaigns can be approved",
      });
    }

    campaign.status = "approved";
    campaign.approvedBy = req.staff._id;
    campaign.approvedAt = new Date();
    campaign.rejectionReason = "";
    await campaign.save();

    // Notify creator
    await pushNotification({
      staffId: campaign.createdBy,
      title: "Campaign Approved",
      message: `Your campaign "${campaign.name}" has been approved.`,
      type: "campaign",
      meta: { campaignId: campaign._id },
    });

    return res.json({
      message: "Campaign approved successfully",
      campaign,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Failed to approve campaign",
      error: err.message,
    });
  }
};

// Reject campaign (Super Admin only)
exports.rejectCampaign = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        message: "Rejection reason is required",
      });
    }

    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    if (campaign.status !== "pending_approval") {
      return res.status(400).json({
        message: "Only pending campaigns can be rejected",
      });
    }

    campaign.status = "rejected";
    campaign.rejectionReason = reason;
    campaign.approvedBy = null;
    campaign.approvedAt = null;
    await campaign.save();

    // Notify creator
    await pushNotification({
      staffId: campaign.createdBy,
      title: "Campaign Rejected",
      message: `Your campaign "${campaign.name}" was rejected. Reason: ${reason}`,
      type: "campaign",
      meta: { campaignId: campaign._id },
    });

    return res.json({
      message: "Campaign rejected",
      campaign,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Failed to reject campaign",
      error: err.message,
    });
  }
};

// Delete campaign
exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Only allow deletion of draft, rejected, or approved campaigns (not sent)
    if (campaign.status === "sent") {
      return res.status(400).json({
        message: "Cannot delete sent campaigns",
      });
    }

    await Campaign.findByIdAndDelete(req.params.id);
    return res.json({ message: "Campaign deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Send campaign (Super Admin only)
exports.sendCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Can only send approved or scheduled campaigns
    if (
      campaign.status !== "approved" &&
      campaign.status !== "scheduled" &&
      req.staff.role !== "superadmin"
    ) {
      return res.status(400).json({
        message: "Campaign must be approved or scheduled before sending",
      });
    }

    if (campaign.status === "sent") {
      return res.status(400).json({ message: "Campaign already sent" });
    }

    // ... email sending logic here ...
    // Fetch subscribers, send emails, update stats

    campaign.status = "sent";
    if (campaign.scheduleDate?.date) {
      campaign.scheduleDate.isSent = true;
    }
    await campaign.save();

    return res.status(200).json({
      message: "Campaign sent successfully",
      stats: campaign.stats,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Failed to send campaign",
      error: err.message,
    });
  }
};
