
const PricingConfig = require("../models/extra/PricingConfig");
const { superAdminAuth } = require("../middlewares/adminAuth");

const createPricingConfig = async (req, res, next) => {
  try {
    await superAdminAuth(req, res, () => {});

    const {
      configType,
      markupType,
      markupValue,
      platformFee,
      refundProtectionFee,
    } = req.body;


    await PricingConfig.updateMany(
      { configType, isActive: true },
      { isActive: false }
    );

    const pricingConfig = new PricingConfig({
      configType,
      markupType,
      markupValue,
      platformFee,
      refundProtectionFee: refundProtectionFee || 0,
      createdBy: req.user._id,
    });

    await pricingConfig.save();

    res.status(201).json({
      success: true,
      message: "Pricing configuration created successfully",
      data: pricingConfig,
    });
  } catch (error) {
    next(error);
  }
};

const getPricingConfigs = async (req, res, next) => {
  try {
    await superAdminAuth(req, res, () => {});

    const { page = 1, limit = 10, type } = req.query;
    const query = {};

    if (type) {
      query.configType = type;
    }

    const configs = await PricingConfig.find(query)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PricingConfig.countDocuments(query);

    res.json({
      configs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    next(error);
  }
};

const getActivePricingConfig = async (req, res, next) => {
  try {
    await superAdminAuth(req, res, () => {});

    const { type } = req.body;

    const config = await PricingConfig.findOne({
      configType: type,
      isActive: true,
    }).populate("createdBy", "name email");

    if (!config) {
      return res
        .status(404)
        .json({ error: "No active pricing configuration found" });
    }

    res.json(config);
  } catch (error) {
    next(error);
  }
};

const updatePricingConfig = async (req, res, next) => {
  try {
    await superAdminAuth(req, res, () => {});

    const { id } = req.body;
    const updates = req.body;

    const config = await PricingConfig.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "name email");

    if (!config) {
      return res.status(404).json({ error: "Pricing configuration not found" });
    }

    res.json({
      success: true,
      message: "Pricing configuration updated successfully",
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

const deletePricingConfig = async (req, res, next) => {
  try {
    await superAdminAuth(req, res, () => {});

    const { id } = req.body;

    const config = await PricingConfig.findByIdAndDelete(id);

    if (!config) {
      return res.status(404).json({ error: "Pricing configuration not found" });
    }

    res.json({
      success: true,
      message: "Pricing configuration deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPricingConfig,
  getPricingConfigs,
  getActivePricingConfig,
  updatePricingConfig,
  deletePricingConfig,
};
