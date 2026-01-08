const router = require("express").Router();
const { staffAuth, seoOrSuperAdminOnly, superAdminOnly } = require("../middlewares/staffAuth.middleware");
const ctrl = require("../controllers/campaign.controller");

// IMPORTANT: Specific routes MUST come BEFORE parameterized routes (/:id)

// Approval workflow (Super Admin only) - MUST BE FIRST
router.get("/pending", staffAuth(), superAdminOnly, ctrl.getPendingCampaigns);
router.post("/:id/submit", staffAuth(), seoOrSuperAdminOnly, ctrl.submitForApproval);
router.post("/:id/approve", staffAuth(), superAdminOnly, ctrl.approveCampaign);
router.post("/:id/reject", staffAuth(), superAdminOnly, ctrl.rejectCampaign);

// Send or schedule (Super Admin only)
router.post("/:id/send", staffAuth(), superAdminOnly, ctrl.sendCampaign);

// Create / Update campaigns (SEO and Super Admin)
router.post("/", staffAuth(), seoOrSuperAdminOnly, ctrl.createCampaign);
router.put("/:id", staffAuth(), seoOrSuperAdminOnly, ctrl.updateCampaign);

// Get routes - /pending is already above, so now general routes
router.get("/", staffAuth(), seoOrSuperAdminOnly, ctrl.getAllCampaigns);
router.get("/:id", staffAuth(), seoOrSuperAdminOnly, ctrl.getCampaignById); // This MUST be last among GET routes

// Delete route
router.delete("/:id", staffAuth(), seoOrSuperAdminOnly, ctrl.deleteCampaign);

module.exports = router;