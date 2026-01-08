const express = require("express");
const { auditLogs } = require("../controllers/auditsLogs.controller");
const router = express.Router();


router.get("/auditlogs", auditLogs);

module.exports = router;