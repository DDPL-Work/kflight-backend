const express = require('express');
const { adminCancellationRequest } = require('../controllers/adminCancellation.controller');
const router  = express.Router();

router.get('/admin-cancellation', adminCancellationRequest)

module.exports = router;