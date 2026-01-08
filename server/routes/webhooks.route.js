
const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller.js');

router.post('/razorpay', express.raw({ type: 'application/json' }), webhookController.handleRazorpayWebhook);
router.post('/stripe', express.raw({ type: 'application/json' }), webhookController.handleStripeWebhook);

module.exports = router;