const express = require("express");
const router = express.Router();
const {hotelBooking} = require("../controllers/book.controller.js");
const bookingController = require("../controllers/booking.controller.js");


router.get("/bookings", hotelBooking);

router.post('/create', bookingController.createBooking);
router.get('/:id', bookingController.getBookingData);
router.post('/:id/payment', bookingController.initiatePayment);
router.post('/:id/confirm', bookingController.confirmPayment);

module.exports = router;