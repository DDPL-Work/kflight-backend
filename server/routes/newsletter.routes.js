const router = require("express").Router();
const { verifyAdmin } = require("../middlewares/auth");
const ctrl = require("../controllers/newsletter.controller");

router.post("/:campaignId", verifyAdmin, ctrl.createNewsletter);
router.get("/:campaignId", verifyAdmin, ctrl.getNewslettersByCampaign);

module.exports = router;
