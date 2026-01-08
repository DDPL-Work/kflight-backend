// routes/test.route.js
const express = require("express");
const { testSMS } = require("../controllers/test.controller");

const router = express.Router();

router.post("/test-sms", testSMS);

module.exports = router;
