// controllers/offerController.js

const Offer = require('../models/offer.js');
const OfferUsage = require('../models/extra/OfferUsage.js');
const { fetchTripjackDeals } = require('../services/tripjackService.js');
const redisClient = require('../utils/redisClient.js');
const Staff = require('../models/staff.model.js');
const { notifyUser } = require('../utils/notify.js');

// ----------------- Helper for counters -----------------
async function incrementCounter(key, field, expireInSec = 86400) {
  try {
    await redisClient.client.hincrby(key, field, 1);
    await redisClient.client.expire(key, expireInSec);
  } catch (err) {
    console.error(`❌ Error incrementing counter ${key}:${field}`, err.message);
  }
}

// ----------------- Offer CRUD -----------------

// Create a new offer
async function createOffer(payload) {
  try {
    // Create the offer
    const offer = await Offer.create(payload);

    // Clear homepage cache
    await redisClient.deleteValue('offers:homepage');

    // Fetch all active superadmins
    const superAdmins = await Staff.find({ role: "superadmin", is_active: true });

    // Send notification to each superadmin
    for (const admin of superAdmins) {
      await notifyUser({
        userId: admin._id,
        title: "🎉 New Offer Created",
        message: `A new offer "${offer.title}" has been created.`,
        type: "OFFER",
        meta: { offerId: offer._id.toString() },
      });
    }

    return offer;
  } catch (err) {
    console.error("❌ Error creating offer:", err);
    throw err;
  }
}

// Update existing offer
async function updateOffer(id, updates) {
  const offer = await Offer.findByIdAndUpdate(id, updates, { new: true });
  await redisClient.deleteValue('offers:homepage');
  return offer;
}

// Delete an offer by ID
async function deleteOffer(id) {
  const offer = await Offer.findByIdAndDelete(id);
  if (!offer) throw new Error('Offer not found');
  await redisClient.deleteValue('offers:homepage');
  return offer;
}

// Revoke an offer
async function revokeOffer(id) {
  const offer = await Offer.findByIdAndUpdate(id, { revoked: true }, { new: true });
  if (!offer) throw new Error('Offer not found');
  await redisClient.deleteValue('offers:homepage');
  return offer;
}

// Use an offer
async function useOffer(userId, offerId) {
  const offer = await Offer.findById(offerId);
  if (!offer) throw new Error('Offer not found');
  if (offer.isUsed) throw new Error('Offer has already been used');

  offer.isUsed = true;
  offer.usedBy = userId;
  await offer.save();

  await redisClient.deleteValue('offers:homepage'); // clear cache if needed
  return offer;
}


// Get all active offers for homepage
async function getHomepageOffers() {
  const cacheKey = 'offers:homepage';
  const cached = await redisClient.getValue(cacheKey);
  if (cached) return JSON.parse(cached);

  const localOffers = await Offer.find({
    active: true,
    startAt: { $lte: new Date() },
    $or: [{ endAt: null }, { endAt: { $gte: new Date() } }]
  }).lean();

  const tripjackDeals = await fetchTripjackDeals({ query: {}, forceRefresh: false });

  const merged = [
    ...localOffers.map(o => ({ ...o, source: 'local' })),
    ...tripjackDeals.map(d => ({ ...d, source: 'tripjack' }))
  ];

  await redisClient.setValue(cacheKey, JSON.stringify(merged), 15); // cache 15s
  return merged;
}

// Get all offers (admin)
async function getAllOffers() {
  return Offer.find().lean();
}

// ----------------- Offer Usage / Analytics -----------------

// Track an offer event
async function trackOfferEvent({ offerId, userId, bookingId, eventType, valueCaptured = 0, ip, userAgent, meta = {} }) {
  const rec = await OfferUsage.create({ offerId, userId, bookingId, eventType, valueCaptured, ip, userAgent, meta });
  const countersKey = `offer:${offerId}:counters`;
  await incrementCounter(countersKey, eventType);
  return rec;
}

// Get offer analytics
async function getOfferAnalytics(offerId, { from, to } = {}) {
  const match = { offerId };
  if (from || to) match.createdAt = {};
  if (from) match.createdAt.$gte = new Date(from);
  if (to) match.createdAt.$lte = new Date(to);

  const agg = await OfferUsage.aggregate([
    { $match: match },
    { $group: { _id: '$eventType', count: { $sum: 1 }, totalValue: { $sum: '$valueCaptured' } } }
  ]);

  const result = agg.reduce((acc, cur) => {
    acc[cur._id] = { count: cur.count, totalValue: cur.totalValue };
    return acc;
  }, {});

  const impressions = result.impression?.count || 0;
  const clicks = result.click?.count || 0;
  const redeems = result.redeem?.count || 0;
  const conversion = impressions ? clicks / impressions : 0;
  const redemptionRate = clicks ? redeems / clicks : 0;

  return { impressions, clicks, redeems, conversion, redemptionRate, detail: result };
}

module.exports = {
  createOffer,
  updateOffer,
  deleteOffer,
  revokeOffer,
  useOffer,
  getHomepageOffers,
  getAllOffers,
  trackOfferEvent,
  getOfferAnalytics
};
