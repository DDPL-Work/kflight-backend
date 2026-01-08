const Hotel = require('../models/Hotel.js');

const baseURL = 'https://apitest.tripjack.com/oms/v1/hotel/book'

const flightBooking = async (req, res) => {
    try {
        return res.status(200).json({ success: true, message: "Flight bookings fetched successfully", data: [] });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

const hotelBooking = async (req, res) => {
    try {
        return res.status(200).json({ success: true, message: "Hotel bookings fetched successfully", data: [] });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}


module.exports = { hotelBooking, flightBooking };