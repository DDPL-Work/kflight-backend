// server-render-kflight/server/utils/applyPricingFromSnapshot.js
module.exports = function applyPricingFromSnapshot(
  supplierFare,
  pricingRules
) {
  let fare = supplierFare;
  const base = supplierFare; // 🔒 lock original base

  const sortedRules = [...pricingRules].sort(
    (a, b) => a.precedence - b.precedence
  );

  for (const rule of sortedRules) {
    if (rule.markupType === "flat") {
      fare += rule.markupValue || 0;
    }

    if (rule.markupType === "percentage") {
      fare += (base * (rule.markupValue || 0)) / 100;
    }

    if (rule.platformFee) {
      fare += rule.platformFee;
    }
  }

  return Math.round(fare);
};
