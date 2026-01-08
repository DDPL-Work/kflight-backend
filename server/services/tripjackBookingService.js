// services/tripjackBookingService.js

const axios = require("axios");

const TRIPJACK_API_KEY = process.env.TRIPJACK_API_KEY;

// =======================================================
// TripJack Sandbox Endpoints
// =======================================================

const AMENDMENT_CHARGES_URL =
  "https://apitest.tripjack.com/oms/v1/air/amendment/amendment-charges";

const SUBMIT_AMENDMENT_URL =
  "https://apitest.tripjack.com/oms/v1/air/amendment/submit-amendment";

const AMENDMENT_DETAILS_URL =
  "https://apitest.tripjack.com/oms/v1/air/amendment/amendment-details";

const FARERULE_URL = "https://apitest.tripjack.com/fms/v2/farerule";
const REVIEW_URL = "https://apitest.tripjack.com/fms/v1/review";
const SEAT_URL = "https://apitest.tripjack.com/fms/v1/seat";

const BOOK_URL = "https://apitest.tripjack.com/oms/v1/air/book";
const FARE_VALIDATE_URL = "https://apitest.tripjack.com/oms/v1/air/fare-validate";
const CONFIRM_BOOK_URL = "https://apitest.tripjack.com/oms/v1/air/confirm-book";
const BOOKING_DETAILS_URL = "https://apitest.tripjack.com/oms/v1/booking-details";
const RELEASE_PNR_URL = "https://apitest.tripjack.com/oms/v1/air/unhold";

// =======================================================
// Headers
// =======================================================
const headers = () => ({
  "Content-Type": "application/json",
  accept: "application/json",
  apikey: TRIPJACK_API_KEY,
});

// =======================================================
// HTTP Wrapper
// =======================================================
async function callTripjack(url, body) {
  try {
    console.log("\n==== TRIPJACK REQUEST ====");
    console.log(JSON.stringify(body, null, 2));

    const resp = await axios.post(url, body, {
      headers: headers(),
      timeout: 20000,
    });

    return resp.data;
  } catch (err) {
    console.error("\n==== TRIPJACK ERROR ====");
    console.error(JSON.stringify(err.response?.data || err.message, null, 2));

    return (
      err.response?.data || {
        status: { success: false },
        errors: [{ message: err.message }],
      }
    );
  }
}

// =======================================================
// SERVICE METHODS
// =======================================================
module.exports = {
  // 1️⃣ Fare Rules
 getFareRules: ({ flowType, id }) =>
  callTripjack(FARERULE_URL, { flowType, id }),


  // 2️⃣ Review Flight (creates bookingId)
  reviewFlight: ({ priceIds }) =>
    callTripjack(REVIEW_URL, { priceIds }),

  // 3️⃣ Seat Map
  getSeatMap: ({ bookingId }) =>
    callTripjack(SEAT_URL, { bookingId }),

  // 4️⃣ HOLD Booking (NO paymentInfos)
  holdBooking: ({ bookingId, travellerInfo, deliveryInfo, contactInfo, gstInfo }) => {
    const payload = { bookingId, travellerInfo, deliveryInfo };

    if (contactInfo) payload.contactInfo = contactInfo;
    if (gstInfo) payload.gstInfo = gstInfo;

    return callTripjack(BOOK_URL, payload);
  },

  // 5️⃣ ✅ INSTANT BOOKING (WITH PAYMENT)
  instantBookFlight: ({
    bookingId,
    amount, // TF from review response
    travellerInfo,
    deliveryInfo,
    contactInfo,
    gstInfo,
  }) => {
    if (!bookingId || !amount || !travellerInfo?.length || !deliveryInfo) {
      throw new Error("Missing required fields for instant booking");
    }

    const payload = {
      bookingId,
      paymentInfos: [{ amount }],
      travellerInfo,
      deliveryInfo,
    };

    if (contactInfo) payload.contactInfo = contactInfo;
    if (gstInfo) payload.gstInfo = gstInfo;

    return callTripjack(BOOK_URL, payload);
  },

  // 6️⃣ Fare Validate
  validateFare: ({ bookingId }) =>
    callTripjack(FARE_VALIDATE_URL, { bookingId }),

  // 7️⃣ Confirm Booking
  confirmBooking: ({ bookingId, amount }) =>
    callTripjack(CONFIRM_BOOK_URL, {
      bookingId,
      paymentInfos: [{ amount }],
    }),

  // 8️⃣ Booking Details (PNR / Tickets)
  getBookingDetails: ({ bookingId }) =>
    callTripjack(BOOKING_DETAILS_URL, { bookingId }),


  releasePNR: async ({ bookingId, pnrs }) => {
  if (!bookingId || !Array.isArray(pnrs) || !pnrs.length) {
    throw new Error("bookingId and pnrs array are mandatory to release PNR");
  }

  const payload = { bookingId, pnrs };
  return callTripjack(RELEASE_PNR_URL, payload);
},

// =======================================================
// AMENDMENT / CANCELLATION APIs
// =======================================================

/**
 * 1️⃣ Get Amendment Charges (Optional)
 */
getAmendmentCharges: async ({
  bookingId,
  type = "CANCELLATION",
  remarks,
  trips,
}) => {
  if (!bookingId || !remarks) {
    throw new Error("bookingId and remarks are mandatory");
  }

  const payload = { bookingId, type, remarks };
  if (trips?.length) payload.trips = trips;

  return callTripjack(AMENDMENT_CHARGES_URL, payload);
},

/**
 * 2️⃣ Submit Amendment (Apply Cancellation)
 */
submitAmendment: async ({
  bookingId,
  type = "CANCELLATION",
  remarks,
  trips,
}) => {
  if (!bookingId || !remarks) {
    throw new Error("bookingId and remarks are mandatory");
  }

  const payload = { bookingId, type, remarks };
  if (trips?.length) payload.trips = trips;

  return callTripjack(SUBMIT_AMENDMENT_URL, payload);
},

/**
 * 3️⃣ Get Amendment Details (Polling)
 */
getAmendmentDetails: async ({ amendmentId }) => {
  if (!amendmentId) {
    throw new Error("amendmentId is required");
  }

  return callTripjack(AMENDMENT_DETAILS_URL, { amendmentId });
},


};
