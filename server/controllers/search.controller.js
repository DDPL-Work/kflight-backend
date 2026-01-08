const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const redis = require("../config/redis.config.js");
const pricingService = require("../utils/pricingService");

const searchFlights = async (req, res, next) => {
  try {
    const {
      origin,
      destination,
      departureDate,
      passengers,
      returnDate,
      cabinClass,
    } = req.body;


    const cacheKey = `search:flights:${origin}:${destination}:${departureDate}:${passengers}:${cabinClass}`;


    const cachedResults = await redis.get(cacheKey);

    if (cachedResults) {
      return res.json({
        source: "cache",
        data: JSON.parse(cachedResults),
        timestamp: new Date().toISOString(),
      });
    }


    const apiKey = process.env.TRIPJACK_API_KEY;
    const apiUrl = process.env.TRIPJACK_API_URL;

    const response = await axios.post(
      `${apiUrl}/search/flights`,
      {
        origin,
        destination,
        departureDate,
        passengers,
        returnDate,
        cabinClass,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

 
    const processedResults = await pricingService.applyMarkups(
      response.data,
      "flight"
    );

 
    await redis.setex(cacheKey, 3600, JSON.stringify(processedResults));

    res.json({
      source: "api",
      data: processedResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

const searchHotels = async (req, res, next) => {
  try {
    const { location, checkIn, checkOut, guests, rooms } = req.body;


    const cacheKey = `search:hotels:${location}:${checkIn}:${checkOut}:${guests}:${rooms}`;


    const cachedResults = await redis.get(cacheKey);

    if (cachedResults) {
      return res.json({
        source: "cache",
        data: JSON.parse(cachedResults),
        timestamp: new Date().toISOString(),
      });
    }


    const apiKey = process.env.HOTEL_API_KEY;
    const apiUrl = process.env.HOTEL_API_URL;

    const response = await axios.post(
      `${apiUrl}/search/hotels`,
      {
        location,
        checkIn,
        checkOut,
        guests,
        rooms,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const processedResults = await pricingService.applyMarkups(
      response.data,
      "hotel"
    );


    await redis.setex(cacheKey, 3600, JSON.stringify(processedResults));

    res.json({
      source: "api",
      data: processedResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

const getCachedResults = async (req, res, next) => {
  try {
    const { type, key } = req.body;
    const cachedResults = await redis.get(`search:${type}:${key}`);

    if (!cachedResults) {
      return res.status(404).json({ error: "Cached results not found" });
    }

    res.json({
      data: JSON.parse(cachedResults),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchFlights,
  searchHotels,
  getCachedResults,
};
