const express = require("express");
const router = express.Router();
const SEOController = require("../controllers/seoController");

router.post("/", SEOController.createSeoPage);

// sitemap MUST be above slug route
router.get("/sitemap.xml", SEOController.generateSitemap);

router.get("/", SEOController.getAllSeoPages);
router.delete("/", SEOController.deleteAllSeoPages);

router.get("/:slug", SEOController.getSeoPageBySlug);
router.put("/:id", SEOController.updateSeoPage);
router.patch("/:id/publish", SEOController.publishSeoPage);
router.delete("/:id", SEOController.deleteSeoPage);

module.exports = router;
