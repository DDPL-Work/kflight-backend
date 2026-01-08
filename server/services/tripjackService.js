const axios = require('axios');

const TRIPJACK_API = {
  SEARCH: "https://apitest.tripjack.com/fms/v1/air-search-all",
  FARERULE: "https://apitest.tripjack.com/fms/v2/farerule",
  REVIEW: "https://apitest.tripjack.com/fms/v1/review",
  BOOK: "https://apitest.tripjack.com/oms/v1/air/book",
  CONFIRM_FARE: "https://apitest.tripjack.com/oms/v1/air/fare-validate",
  CONFIRM_HOLD_BOOK: "https://apitest.tripjack.com/oms/v1/air/confirm-book",
  BOOKING_DETAILS: "https://apitest.tripjack.com/oms/v1/booking-details",
  RELEASE_PNR: "https://apitest.tripjack.com/oms/v1/air/unhold",
  SEAT: "https://apitest.tripjack.com/fms/v1/seat",
  AMENDMENT_CHARGES: "https://apitest.tripjack.com/oms/v1/air/amendment/amendment-charges",
  SUBMIT_AMENDMENT: "https://apitest.tripjack.com/oms/v1/air/amendment/submit-amendment",
  AMENDMENT_DETAILS: "https://apitest.tripjack.com/oms/v1/air/amendment/amendment-details",
  USER_DETAIL: "https://apitest.apitest.tripjack.com/ums/v1/user-detail",
};

// Generic API call
async function callTripJack(url, payload, method = 'post', headers = {}) {
  try {
    const response = await axios({
      method,
      url,
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });
    return response.data;
  } catch (err) {
    console.error(`TripJack API error on ${url}:`, err.response?.data || err.message);
    throw err;
  }
}

module.exports = { TRIPJACK_API, callTripJack };
