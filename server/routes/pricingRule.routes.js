// routes/flightpricingRule.routes.js

const router = require("express").Router();
const ctrl = require("../controllers/pricingRule.controller");

router.get("/", ctrl.getRules);
router.post("/", ctrl.createRule);
router.put("/:id", ctrl.updateRule);
router.delete("/:id", ctrl.deleteRule);
router.patch("/:id/status", ctrl.changeStatus);
router.put("/reorder", ctrl.reorderRules);

module.exports = router;
