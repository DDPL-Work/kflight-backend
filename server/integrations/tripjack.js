// server/integrations/tripjack.js

const axios = require("axios");
const TRIPJACK_API_KEY = process.env.TRIPJACK_API_KEY;

const TRIPJACK_SEARCH_URL = "https://apitest.tripjack.com/fms/v1/air-search-all";

/**
 * Unified TripJack flight search wrapper
 * So controllers can use tripjack.searchFlights()
 */
async function searchFlights({ origin, destination, date, passengers }) {
  try {
    const searchQuery = {
      searchQuery: {
        legs: [
          {
            origin,
            destination,
            journeyType: "ONE_WAY",
            flightCabinClass: "ECONOMY",
            travelDate: date
          }
        ],
        paxInfo: {
          ADULT: passengers?.adults || 1,
          CHILD: passengers?.children || 0,
          INFANT: passengers?.infants || 0
        }
      }
    };

    const headers = {
      "Content-Type": "application/json",
      apikey: TRIPJACK_API_KEY
    };

    const response = await axios.post(TRIPJACK_SEARCH_URL, searchQuery, { headers });

    const result = response.data?.searchResult;

    if (!result?.tripInfos?.ONWARD) {
      return { flights: [] };
    }

    // Convert TripJack flight response into uniform list
    const flights = result.tripInfos.ONWARD.flatMap((itinerary) => {
      return itinerary.totalPriceList.map((price) => ({
        tripjack_id: price.id,
        airline: itinerary.sI?.map(s => s.fD?.aI?.name)?.join(", "),
        segments: itinerary.sI,
        fare: {
          baseFare: price?.fd?.ADULT?.fC?.BF || 0,
          tax: price?.fd?.ADULT?.fC?.TAF || 0,
          currency: "INR"
        }
      }));
    });

    return { flights };

  } catch (err) {
    console.error("TripJack Search Error:", err.response?.data || err);
    return { flights: [] };
  }
}

module.exports = { searchFlights };
