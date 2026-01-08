// server/routes/flightSearch.routes.js

const router = require("express").Router();
const { searchFlights } = require("../controllers/flightSearch.controller");

function validateSearch(req, res, next) {
  const { tripType, routeInfos, passengers } = req.body;

  if (!["ONE_WAY", "ROUND_TRIP", "MULTI_CITY"].includes(tripType)) {
    return res.status(400).json({
      success: false,
      message: "Invalid tripType"
    });
  }

  if (!Array.isArray(routeInfos) || routeInfos.length === 0) {
    return res.status(400).json({
      success: false,
      message: "routeInfos required"
    });
  }

  for (const r of routeInfos) {
    if (!r.fromCityOrAirport?.code || !r.toCityOrAirport?.code || !r.travelDate) {
      return res.status(400).json({
        success: false,
        message: "Invalid routeInfo"
      });
    }
  }

  if (!passengers?.adult) {
    return res.status(400).json({
      success: false,
      message: "At least 1 adult required"
    });
  }

  next();
}

router.post("/search", validateSearch, searchFlights);

module.exports = router;
