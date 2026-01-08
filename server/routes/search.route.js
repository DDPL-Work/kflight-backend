// File: routes/search.js
const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller.js');

router.post('/flights', searchController.searchFlights);
router.get('/flights/cache/:key', searchController.getCachedResults);

module.exports = router;