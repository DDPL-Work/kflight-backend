// routes/offer.routes.js
const express = require('express');
const router = express.Router();
const OfferCtrl = require('../controllers/offers.controller.js');
const upload = require("../middlewares/upload.js");
const cloudinary = require("../config/cloudinary.js");

// ---------------- Create a new offer with optional image ----------------
router.post('/', upload.single("image"), async (req, res) => {
  try {
    let imageUrl = null;

    if (req.file) {
      if (!cloudinary || !cloudinary.uploader) {
        throw new Error("Cloudinary is not properly configured");
      }

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "offers" },
          (error, result) => {
            if (error) {
              console.error("❌ Cloudinary upload failed:", error);
              return reject(error);
            }
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      imageUrl = result.secure_url;
    }

    const offer = await OfferCtrl.createOffer({ ...req.body, imageUrl });
    res.status(201).json({ success: true, data: offer });
  } catch (err) {
    console.error("❌ Create Offer Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------- Update an offer ----------------
router.put('/:id', async (req, res) => {
  try {
    const offer = await OfferCtrl.updateOffer(req.params.id, req.body);
    res.status(200).json({ success: true, data: offer });
  } catch (err) {
    console.error("❌ Update Offer Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------- Delete an offer ----------------
router.delete('/:id', async (req, res) => {
  try {
    const offer = await OfferCtrl.deleteOffer(req.params.id);
    res.status(200).json({ success: true, data: offer });
  } catch (err) {
    console.error("❌ Delete Offer Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------- Revoke an offer ----------------
router.post('/:id/revoke', async (req, res) => {
  try {
    const offer = await OfferCtrl.revokeOffer(req.params.id);
    res.status(200).json({ success: true, data: offer });
  } catch (err) {
    console.error("❌ Revoke Offer Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------- Use an offer ----------------
router.post('/:id/use', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: "userId is required" });
    }

    const offer = await OfferCtrl.useOffer(userId, req.params.id);
    res.status(200).json({ success: true, data: offer });
  } catch (err) {
    console.error("❌ Use Offer Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------- Get all offers (admin) ----------------
router.get('/list', async (req, res) => {
  try {
    const offers = await OfferCtrl.getAllOffers();
    res.status(200).json({ success: true, count: offers.length, data: offers });
  } catch (err) {
    console.error("❌ Get All Offers Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------- Get homepage offers ----------------
router.get('/', async (req, res) => {
  try {
    const offers = await OfferCtrl.getHomepageOffers();
    res.status(200).json({ success: true, count: offers.length, data: offers });
  } catch (err) {
    console.error("❌ Get Homepage Offers Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------- Track offer event ----------------
router.post('/:id/track', async (req, res) => {
  try {
    const event = await OfferCtrl.trackOfferEvent({ offerId: req.params.id, ...req.body });
    res.status(200).json({ success: true, data: event });
  } catch (err) {
    console.error("❌ Track Offer Event Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------- Get offer analytics ----------------
router.get('/:id/analytics', async (req, res) => {
  try {
    const analytics = await OfferCtrl.getOfferAnalytics(req.params.id);
    res.status(200).json({ success: true, data: analytics });
  } catch (err) {
    console.error("❌ Get Offer Analytics Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
