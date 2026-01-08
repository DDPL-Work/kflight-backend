// utils/applyPricing.js

const PricingRule = require("../models/PricingRule.model");

module.exports.applyPricingFromDB = function (supplierFare, flightInfo, rules) {
  let fare = supplierFare;
  const base = supplierFare;
  const appliedRules = [];

  for (const rule of rules) {
    if (rule.airlines?.length && !rule.airlines.includes(flightInfo.airline)) continue;
    if (rule.routes?.length && !rule.routes.some(r => r.from === flightInfo.from && r.to === flightInfo.to)) continue;
    if (base < rule.conditions.minFare || base > rule.conditions.maxFare) continue;

    if (rule.markupType === "flat") fare += rule.markupValue || 0;
    if (rule.markupType === "percentage") fare += (base * (rule.markupValue || 0)) / 100;
    if (rule.platformFee) fare += rule.platformFee;

    appliedRules.push({
      ruleId: rule._id,
      name: rule.name,
      markupType: rule.markupType,
      markupValue: rule.markupValue,
      platformFee: rule.platformFee,
      precedence: rule.precedence
    });
  }

  return {
    finalFare: Math.round(fare),
    appliedRules
  };
};

