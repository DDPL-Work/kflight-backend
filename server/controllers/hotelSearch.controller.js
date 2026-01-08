// controllers/hotelSearch.controller.js

const { v4: uuidv4 } = require("uuid");
const HotelPriceSnapshot = require("../models/HotelPriceSnapshot.model");
const { applyHotelPricingFromDB } = require("../utils/applyHotelPricing");
const tripjack = require("../services/tripjackHotelService");

// Helper to normalize TripJack payload
const normalizeSearchPayload = (searchQuery) => {
  const { checkinDate, checkoutDate, roomInfo, searchCriteria } = searchQuery;

  // Basic validation
  if (!checkinDate || !checkoutDate || !roomInfo || !searchCriteria) {
    throw new Error("Missing required searchQuery fields");
  }

  return {
    searchQuery: {
      checkinDate, // format: YYYY-MM-DD
      checkoutDate,
      roomInfo: roomInfo.map((room) => ({
        numberOfAdults: room.numberOfAdults || 1,
        numberOfChildren: room.numberOfChildren || 0,
      })),
      searchCriteria: {
        nationality: searchCriteria.nationality || "106",
        currency: searchCriteria.currency || "INR",
      },
      // Optional: preferences can be added if needed
      searchPreferences: searchQuery.searchPreferences || undefined,
    },
    sync: true,
  };
};

// Search hotels
exports.searchHotels = async (req, res) => {
  try {
    const { searchQuery, region = "global" } = req.body;

    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        message: "searchQuery is required in request body",
      });
    }

    const payload = normalizeSearchPayload(searchQuery);
    const searchSessionId = uuidv4();

    const tjResp = await tripjack.searchHotels(payload);

    // Handle API errors
    if (tjResp.status === 400) {
      return res.status(400).json({
        success: false,
        message: tjResp.data?.errors || "TripJack API Bad Request",
      });
    }

    const hotels = tjResp.data?.searchResult?.his || [];

    // Apply pricing rules and save snapshot
    for (const hotel of hotels) {
      for (const option of hotel.ops || []) {
        const supplierFare = option.tp;

        const pricing = await applyHotelPricingFromDB(
          supplierFare,
          {
            hotelId: hotel.uid,
            city: hotel.ad?.ctn,
            country: hotel.ad?.cn,
            rating: hotel.rt,
          },
          region
        );

        const snapshot = await HotelPriceSnapshot.create({
          searchSessionId,
          hotelId: hotel.uid,
          optionId: option.id,
          supplierFare,
          finalFare: pricing.finalFare,
          markupApplied: pricing.finalFare - supplierFare,
          pricingRules: pricing.appliedRules,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        });

        option.supplierFare = supplierFare;
        option.finalFare = pricing.finalFare;
        option.snapshotId = snapshot._id;
      }
    }

    return res.json({
      success: true,
      searchSessionId,
      data: hotels,
    });
  } catch (err) {
    console.error("Hotel search error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Placeholder endpoints
exports.reviewHotel = async (req, res) => {
  res.status(200).json({ success: true, message: "Review endpoint placeholder" });
};

exports.holdHotel = async (req, res) => {
  res.status(200).json({ success: true, message: "Hold endpoint placeholder" });
};

exports.bookHotel = async (req, res) => {
  res.status(200).json({ success: true, message: "Book endpoint placeholder" });
};
