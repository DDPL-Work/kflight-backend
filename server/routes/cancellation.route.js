const express = require('express');
const { cancellationRequest } = require('../controllers/cancellation.controller');
const router  = express.Router();

router.get('/cancellation', cancellationRequest);

module.exports = router;