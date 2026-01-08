const express = require("express");
const { contentApproval, offerApproval, refundApproval, adminApproval, disableAdminApproval } = require("../controllers/Approval.controller");
const router = express.Router();

router.get("/content-approval", contentApproval);
router.get("/offer-approval", offerApproval);
router.get("/refund-approval", refundApproval);
router.get("/admin-approval", adminApproval);
router.get("/disable-admin-approval", disableAdminApproval);

module.exports = router;
