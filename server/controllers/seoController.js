const SEO = require("../models/seo.model");
const mongoose = require("mongoose");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const { createSeoSchema } = require("../validations/seo.validation");

// Create SEO Page
exports.createSeoPage = asyncHandler(async (req, res) => {
  const { error } = createSeoSchema.validate(req.body);
  if (error) throw new ApiError(400, error.details[0].message);

  const { title, slug, metaTitle, metaDescription, metaKeywords, canonicalUrl, pageType, pageId, createdBy } = req.body;

  const existing = await SEO.findOne({ slug });
  if (existing) throw new ApiError(409, "Slug already exists");

  const page = await SEO.create({
    title,
    slug,
    metaTitle,
    metaDescription,
    metaKeywords,
    canonicalUrl,
    pageType,
    pageId,
    createdBy,
  });

  return res.status(201).json(new ApiResponse(true, "SEO page created", page));
});

// Get SEO page by slug 
exports.getSeoPageBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const page = await SEO.findOne({ slug, status: "published" });
  if (!page) throw new ApiError(404, "Page not found");

  return res.status(200).json(new ApiResponse(true, "SEO page fetched", page));
});


// Update SEO page
exports.updateSeoPage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ApiError(400, "Invalid ID");
   

  const updated = await SEO.findByIdAndUpdate(id, req.body, { new: true });
  if (!updated) throw new ApiError(404, "Sorry Page Not Found");

  return res.status(200).json(new ApiResponse(true, "SEO page updated", updated));
});

// Publish SEO page
exports.publishSeoPage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ApiError(400, "Invalid ID");

  const updated = await SEO.findByIdAndUpdate(id, { status: "published" }, { new: true });
  if (!updated) throw new ApiError(404, "Page not found");

  return res.status(200).json(new ApiResponse(true, "SEO page published", updated));
});

// Generate sitemap
exports.generateSitemap = asyncHandler(async (req, res) => {
  const pages = await SEO.find({ status: "published" });

  let urls = pages
    .map(
      (p) =>
        `<url><loc>${p.canonicalUrl || `https://karoflight.com/${p.slug}`}</loc></url>`
    )
    .join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

  res.header("Content-Type", "application/xml");
  return res.send(sitemap);
});

// Get all SEO pages
exports.getAllSeoPages = asyncHandler(async (req, res) => {
  const pages = await SEO.find().sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(true, "All SEO pages fetched", pages));
});

// Delete one SEO page
exports.deleteSeoPage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ApiError(400, "Invalid ID");

  const deleted = await SEO.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, "SEO page not found");

  return res
    .status(200)
    .json(new ApiResponse(true, "SEO page deleted successfully", deleted));
});


// Delete all SEO pages
exports.deleteAllSeoPages = asyncHandler(async (req, res) => {
  await SEO.deleteMany({});

  return res
    .status(200)
    .json(new ApiResponse(true, "All SEO pages deleted successfully"));
});

