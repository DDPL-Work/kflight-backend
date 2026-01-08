//hotelPricingRule.routes.js

const router = require("express").Router();
const ctrl = require("../controllers/hotelPricingRule.controller");

// Base: /api/hotel-pricing-rules

router.get("/", ctrl.getRules);
router.post("/", ctrl.createRule);
router.put("/:id", ctrl.updateRule);
router.delete("/:id", ctrl.deleteRule);
router.patch("/:id/status", ctrl.changeStatus);
router.put("/reorder", ctrl.reorderRules);

module.exports = router;
