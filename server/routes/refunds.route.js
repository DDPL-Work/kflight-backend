const express = require("express");
const { refundBooking } = require("../controllers/refunds.controller");
const router = express.Router();

router.get("/refund",refundBooking)

module.exports = router;