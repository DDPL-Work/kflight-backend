// utils/applyHotelPricing.js

const PricingRule = require("../models/PricingRule.model");

exports.applyHotelPricingFromDB = async (
  supplierFare,
  context,
  region
) => {
  const rules = await PricingRule.find({
    isActive: true,
    serviceType: "hotel",
    region,
    "conditions.minFare": { $lte: supplierFare },
    "conditions.maxFare": { $gte: supplierFare }
  }).sort({ precedence: -1 });

  let finalFare = supplierFare;
  const appliedRules = [];

  for (const rule of rules) {
    // 🎯 Filters
    if (
      rule.hotelIds?.length &&
      !rule.hotelIds.includes(context.hotelId)
    ) continue;

    if (
      rule.cities?.length &&
      !rule.cities.includes(context.city)
    ) continue;

    if (
      rule.countries?.length &&
      !rule.countries.includes(context.country)
    ) continue;

    if (
      rule.ratings?.length &&
      !rule.ratings.includes(context.rating)
    ) continue;

    let markup = 0;
    if (rule.markupType === "flat") {
      markup = rule.markupValue;
    } else {
      markup = (finalFare * rule.markupValue) / 100;
    }

    finalFare += markup + (rule.platformFee || 0);
    appliedRules.push(rule.name);
  }

  return {
    finalFare: Math.round(finalFare),
    appliedRules
  };
};
