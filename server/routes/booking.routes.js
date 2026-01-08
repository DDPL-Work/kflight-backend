// // server/routes/booking.routes.js
// const router = require("express").Router();
// const bookingCtrl = require("../controllers/booking.controller");

// // fare rule & review
// router.post("/fare-rule", bookingCtrl.fareRule);
// router.post("/fare-validate", bookingCtrl.fareValidate);

// // main booking
// router.post("/place", bookingCtrl.placeBooking); // hold or instant based on body.bookingType
// router.post("/confirm-hold", bookingCtrl.confirmHold);

// // booking details
// router.post("/details", bookingCtrl.bookingDetails);

// // unhold / release
// router.post("/unhold", bookingCtrl.unhold);

// // seats
// router.post("/seat", bookingCtrl.seat);

// // amendment
// router.post("/amendment/charges", bookingCtrl.amendmentCharges);
// router.post("/amendment/submit", bookingCtrl.submitAmendment);
// router.post("/amendment/details", bookingCtrl.amendmentDetails);

// // user detail
// router.post("/user-detail", bookingCtrl.userDetail);

// module.exports = router;


const router = require("express").Router();
const ctrl = require("../controllers/booking.controller");

// FMS
router.post("/fare-rule", ctrl.fareRule);
router.post("/review", ctrl.review);
router.post("/seat", ctrl.seat);

// OMS Booking
router.post("/fare-validate", ctrl.fareValidate);
router.post("/book", ctrl.placeBooking);            // INSTANT or HOLD
router.post("/confirm-hold", ctrl.confirmHold);
router.post("/booking-details", ctrl.bookingDetails);
router.post("/unhold", ctrl.unhold);

// Amendment
router.post("/amendment-charges", ctrl.amendmentCharges);
router.post("/submit-amendment", ctrl.submitAmendment);
router.post("/amendment-details", ctrl.amendmentDetails);

// UMS
router.post("/user-detail", ctrl.userDetail);

module.exports = router;
