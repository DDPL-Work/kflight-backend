const express = require('express');
const router = express.Router();
const { getTranslation } = require('../controllers/Translator.controller.js');

router.post('/translate', getTranslation);

module.exports = router;
