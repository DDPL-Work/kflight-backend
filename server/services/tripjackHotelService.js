// services/tripjackHotelService.js

const axios = require("axios");

const HMS_BASE = "https://apitest.tripjack.com/hms/v1";
const API_KEY = process.env.TRIPJACK_API_KEY;

const headers = {
  "Content-Type": "application/json",
  apikey: API_KEY
};

exports.searchHotels = body =>
  axios.post(`${HMS_BASE}/hotel-searchquery-list`, body, { headers });

exports.hotelDetails = body =>
  axios.post(`${HMS_BASE}/hotelDetail-search`, body, { headers });

exports.cancellationPolicy = body =>
  axios.post(`${HMS_BASE}/hotel-cancellation-policy`, body, { headers });
