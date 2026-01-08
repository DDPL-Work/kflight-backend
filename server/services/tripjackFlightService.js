// server/services/tripjackFlightService.js

const axios = require("axios");

const TRIPJACK_SEARCH_URL = "https://apitest.tripjack.com/fms/v1/air-search-all";
const TRIPJACK_API_KEY = process.env.TRIPJACK_API_KEY;

async function searchFlights(rawQuery) {
  try {
    const headers = {
      "Content-Type": "application/json",
      apikey: TRIPJACK_API_KEY,
    };

    // IMPORTANT → TripJack requires:  { searchQuery: rawQuery }
    const body = { searchQuery: rawQuery };

    console.log("📤 FINAL REQUEST TO TRIPJACK:", JSON.stringify(body, null, 2));

    const response = await axios.post(TRIPJACK_SEARCH_URL, body, { headers });

    return response.data;

  } catch (err) {
    console.error("🔥 TripJack flight search error:", err.response?.data || err);
    throw new Error("Flight search failed. Please try again later.");
  }
}

module.exports = { searchFlights };
