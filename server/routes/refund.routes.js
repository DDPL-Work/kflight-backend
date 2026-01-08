const express = require("express");
const router = express.Router();
const refundController = require("../controllers/refund.controller");

router.post("/cancellation-refund", refundController.processCancellationRefund);

module.exports = router;
