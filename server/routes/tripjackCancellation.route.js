const express   = require('express');
const { handleTripjackCancellation } = require('../controllers/tripjackcancellation.controller');
const router = express.Router();

router.get('/cancellation', handleTripjackCancellation);

module.exports = router;