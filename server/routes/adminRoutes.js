const express = require("express");
const {
  createPricingConfig,
  getPricingConfigs,
  getActivePricingConfig,
  updatePricingConfig,
  deletePricingConfig
} = require("../controllers/adminController");
const router = express.Router();

router.post("/pricing", createPricingConfig);
router.get("/pricing", getPricingConfigs);
router.get("/pricing/active", getActivePricingConfig);
router.put("/pricing/:id", updatePricingConfig);
router.delete("/pricing/:id", deletePricingConfig);

module.exports = router;