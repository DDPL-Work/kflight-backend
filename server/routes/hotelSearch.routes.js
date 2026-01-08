const router = require("express").Router();
const hotelSearchController = require("../controllers/hotelSearch.controller");

// Hotel search
router.post("/search", hotelSearchController.searchHotels);

// Hotel review placeholder
router.post("/review", hotelSearchController.reviewHotel);

// Hold hotel placeholder
router.post("/hold", hotelSearchController.holdHotel);

// Book hotel placeholder
router.post("/book", hotelSearchController.bookHotel);

module.exports = router;
