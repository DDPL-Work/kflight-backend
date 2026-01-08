const Joi = require("joi");

exports.createSeoSchema = Joi.object({
  title: Joi.string().required(),
  slug: Joi.string().regex(/^[a-z0-9-]+$/).required(),
  metaTitle: Joi.string().optional(),
  metaDescription: Joi.string().optional(),
  metaKeywords: Joi.array().items(Joi.string()).optional(),
  canonicalUrl: Joi.string().uri().optional(),
  pageType: Joi.string().required(),
  pageId: Joi.string().optional(),
  createdBy: Joi.string().hex().length(24).required(),
});
