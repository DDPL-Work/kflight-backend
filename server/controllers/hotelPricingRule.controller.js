const PricingRule = require("../models/PricingRule.model");

/**
 * Get all HOTEL pricing rules
 */
exports.getRules = async (req, res) => {
  const rules = await PricingRule.find({
    serviceType: "hotel"
  }).sort({ precedence: 1 });

  res.json({ success: true, data: rules });
};

/**
 * Create HOTEL pricing rule
 */
exports.createRule = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      serviceType: "hotel" // 🔒 force hotel
    };

    const rule = await PricingRule.create(payload);
    res.json({ success: true, data: rule });

  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * Update HOTEL pricing rule
 */
exports.updateRule = async (req, res) => {
  try {
    const updated = await PricingRule.findOneAndUpdate(
      { _id: req.params.id, serviceType: "hotel" },
      req.body,
      { new: true }
    );

    res.json({ success: true, data: updated });

  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * Delete HOTEL pricing rule
 */
exports.deleteRule = async (req, res) => {
  await PricingRule.findOneAndDelete({
    _id: req.params.id,
    serviceType: "hotel"
  });

  res.json({ success: true, message: "Hotel rule deleted" });
};

/**
 * Activate / Deactivate HOTEL rule
 */
exports.changeStatus = async (req, res) => {
  const updated = await PricingRule.findOneAndUpdate(
    { _id: req.params.id, serviceType: "hotel" },
    { isActive: req.body.isActive },
    { new: true }
  );

  res.json({ success: true, data: updated });
};

/**
 * Reorder HOTEL pricing rules
 */
exports.reorderRules = async (req, res) => {
  const { order } = req.body; // [{ id, precedence }]

  for (const r of order) {
    await PricingRule.findOneAndUpdate(
      { _id: r.id, serviceType: "hotel" },
      { precedence: r.precedence }
    );
  }

  res.json({
    success: true,
    message: "Hotel pricing rules reordered"
  });
};
