// controllers/flightpricingRule.controller.js

const PricingRule = require("../models/PricingRule.model");

// Get all rules
exports.getRules = async (req, res) => {
  const rules = await PricingRule.find().sort({ precedence: 1 });
  res.json({ success: true, data: rules });
};

// Create new rule
exports.createRule = async (req, res) => {
  try {
    const newRule = await PricingRule.create(req.body);
    res.json({ success: true, data: newRule });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Update a rule
exports.updateRule = async (req, res) => {
  try {
    const updated = await PricingRule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete rule
exports.deleteRule = async (req, res) => {
  await PricingRule.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Rule deleted" });
};

// Change active/inactive
exports.changeStatus = async (req, res) => {
  const updated = await PricingRule.findByIdAndUpdate(
    req.params.id,
    { isActive: req.body.isActive },
    { new: true }
  );
  res.json({ success: true, data: updated });
};

// Reorder
exports.reorderRules = async (req, res) => {
  const { order } = req.body; // [{id, precedence}, ...]

  for (const r of order) {
    await PricingRule.findByIdAndUpdate(r.id, { precedence: r.precedence });
  }

  res.json({ success: true, message: "Reordered successfully" });
};
