const express = require("express");
const router = express.Router();
const bookingCtrl = require("../controllers/flightBooking.controller");
const { downloadTicket } = require("../controllers/ticketController");

// =====================
// SEARCH / REVIEW
// =====================
router.post("/fare-rule", bookingCtrl.getFareRules);
router.post("/review", bookingCtrl.reviewFlight);
router.post("/seat-map", bookingCtrl.getSeatMap);

// =====================
// BOOKING
// =====================
router.post("/hold", bookingCtrl.holdBooking);
router.post("/instant-book", bookingCtrl.instantBookFlight);
router.post("/fare-validate", bookingCtrl.validateFare);
router.post("/book-confirm", bookingCtrl.bookAndConfirmFlight);
// =====================
// POST BOOKING
// =====================
router.post("/details", bookingCtrl.getBookingDetails);
router.post("/save-seats", bookingCtrl.saveSeatSelection);
router.post("/release-pnr", bookingCtrl.releasePNR);  
// =====================
// ✨ AMENDMENT / CANCELLATION





// =====================

// 1️⃣ Get cancellation / amendment charges (optional)
router.post(
  "/amendment/charges",
  bookingCtrl.getCancellationCharges
);

// 2️⃣ Submit cancellation / amendment
router.post(
  "/amendment/submit",
  bookingCtrl.cancelBooking
);

// 3️⃣ Poll amendment status
router.post(
  "/amendment/status",
  bookingCtrl.getCancellationStatus
);


// Ticket generation
router.get("/:bookingId/ticket", downloadTicket);

module.exports = router;
