const router = require("express").Router();
const verifyUser = require("../middlewares/userAuth");
const { staffAuth, seoOrSuperAdminOnly } = require("../middlewares/staffAuth.middleware");
const ctrl = require("../controllers/subscription.controller");

// User subscription routes
router.post("/subscribe", verifyUser, ctrl.subscribeUser);
router.post("/unsubscribe", verifyUser, ctrl.unsubscribeUser);
router.get("/check-status", verifyUser, ctrl.checkSubscriptionStatus); 

// Admin routes - Only SEO & Superadmin
router.get("/all", staffAuth(), seoOrSuperAdminOnly, ctrl.getAllSubscribers);

module.exports = router;
