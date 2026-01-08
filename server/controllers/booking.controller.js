// // server/controllers/booking.controller.js
// const { v4: uuid } = require("uuid");
// const tripjack = require("../services/tripjackBookingService");
// const Booking = require("../models/booking.model");


// // 1) Fare rule
// exports.fareRule = async (req, res) => {
//   try {
//     const result = await tripjack.fareRule(req.body);
//     if (!result.ok) return res.status(400).json({ success: false, error: result.error });
//     return res.json({ success: true, data: result.data });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// // 2) Fare validate
// exports.fareValidate = async (req, res) => {
//   try {
//     const result = await tripjack.fareValidate(req.body);
//     if (!result.ok) return res.status(400).json({ success: false, error: result.error });
//     return res.json({ success: true, data: result.data });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// // 3) Place Booking (HOLD or INSTANT)
// exports.placeBooking = async (req, res) => {
//   try {
//     const body = req.body;
//     if (!body.offer || !body.passengers) {
//       return res.status(400).json({
//         success: false,
//         message: "offer and passengers required",
//       });
//     }

//     // IMPORTANT TRIPJACK REQUIRED FIELD
//     const bookingId = uuid();

//     const bookPayload = {
//       bookingRequest: {
//         bookingId,
//         bookingType: body.bookingType || "HOLD",
//         offer: body.offer,
//         passengers: body.passengers,
//         contact: body.contact,
//       }
//     };

//     const tripResp = await tripjack.placeBooking(bookPayload);

//     if (!tripResp.ok)
//       return res.status(400).json({ success: false, error: tripResp.error });


//     // SAVE IN DB
//     const saved = await Booking.create({
//       tripjackBookingRef: tripResp.data?.bookingId || bookingId,
//       bookingType: body.bookingType,
//       status: body.bookingType === "HOLD" ? "HOLD" : "CONFIRMED",
//       passengers: body.passengers,
//       routeInfos: tripResp.data?.routeInfos || [],
//       pricing: tripResp.data?.price || {},
//       rawResponse: tripResp.data,
//     });

//     return res.json({
//       success: true,
//       message: "Booking created",
//       data: {
//         booking: saved,
//         tripjack: tripResp.data,
//       },
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// // 4) Confirm Hold → Ticketing
// exports.confirmHold = async (req, res) => {
//   try {
//     const payload = req.body;

//     const tripResp = await tripjack.confirmHold({
//       bookingId: payload.bookingId,
//       pnr: payload.pnr
//     });

//     if (!tripResp.ok)
//       return res.status(400).json({ success: false, error: tripResp.error });

//     // Update DB
//     await Booking.findOneAndUpdate(
//       { tripjackBookingRef: payload.bookingId },
//       {
//         status: "CONFIRMED",
//         rawResponse: tripResp.data
//       }
//     );

//     return res.json({
//       success: true,
//       data: tripResp.data
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// // 5) Booking details (by pnr or bookingId)
// exports.bookingDetails = async (req, res) => {
//   try {
//     const { pnr, bookingId } = req.body;

//     if (!pnr && !bookingId)
//       return res.status(400).json({ success: false, message: "pnr or bookingId required" });

//     const tripResp = await tripjack.bookingDetails(req.body);

//     if (!tripResp.ok)
//       return res.status(400).json({ success: false, error: tripResp.error });

//     return res.json({ success: true, data: tripResp.data });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// // 6) Unhold (release PNR)
// exports.unhold = async (req, res) => {
//   try {
//     const tripResp = await tripjack.unhold(req.body);

//     if (!tripResp.ok)
//       return res.status(400).json({ success: false, error: tripResp.error });

//     if (req.body.bookingId) {
//       await Booking.findOneAndUpdate(
//         { tripjackBookingRef: req.body.bookingId },
//         { status: "CANCELLED", rawResponse: tripResp.data }
//       );
//     }

//     return res.json({ success: true, data: tripResp.data });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// // 7) Seat map / seat select
// exports.seat = async (req, res) => {
//   try {
//     const tripResp = await tripjack.seat(req.body);
//     if (!tripResp.ok)
//       return res.status(400).json({ success: false, error: tripResp.error });
//     return res.json({ success: true, data: tripResp.data });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// // 8) Amendment flows
// exports.amendmentCharges = async (req, res) => {
//   try {
//     const tripResp = await tripjack.amendmentCharges(req.body);
//     if (!tripResp.ok)
//       return res.status(400).json({ success: false, error: tripResp.error });
//     return res.json({ success: true, data: tripResp.data });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// exports.submitAmendment = async (req, res) => {
//   try {
//     const tripResp = await tripjack.submitAmendment(req.body);
//     if (!tripResp.ok)
//       return res.status(400).json({ success: false, error: tripResp.error });
//     return res.json({ success: true, data: tripResp.data });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// exports.amendmentDetails = async (req, res) => {
//   try {
//     const tripResp = await tripjack.amendmentDetails(req.body);
//     if (!tripResp.ok)
//       return res.status(400).json({ success: false, error: tripResp.error });
//     return res.json({ success: true, data: tripResp.data });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// // 9) User detail
// exports.userDetail = async (req, res) => {
//   try {
//     const tripResp = await tripjack.userDetail(req.body);
//     if (!tripResp.ok)
//       return res.status(400).json({ success: false, error: tripResp.error });
//     return res.json({ success: true, data: tripResp.data });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// server/controllers/booking.controller.js

const tripjack = require("../services/tripjackBookingService");

// 1️⃣ Fare Rule
exports.fareRule = async (req, res) => {
  const result = await tripjack.fareRule(req.body);
  res.json(result);
};

// 2️⃣ Review
exports.review = async (req, res) => {
  const result = await tripjack.review(req.body);
  res.json(result);
};

// 3️⃣ Fare Validate (important before booking)
exports.fareValidate = async (req, res) => {
  const result = await tripjack.fareValidate(req.body);
  res.json(result);
};

// 4️⃣ Place Booking (Instant or Hold)
exports.placeBooking = async (req, res) => {
  const result = await tripjack.placeBooking(req.body);
  res.json(result);
};

// 5️⃣ Confirm Hold Booking
exports.confirmHold = async (req, res) => {
  const result = await tripjack.confirmHold(req.body);
  res.json(result);
};

// 6️⃣ Booking Details
exports.bookingDetails = async (req, res) => {
  const result = await tripjack.bookingDetails(req.body);
  res.json(result);
};

// 7️⃣ Release Hold (Unhold)
exports.unhold = async (req, res) => {
  const result = await tripjack.unhold(req.body);
  res.json(result);
};

// 8️⃣ Seat Map
exports.seat = async (req, res) => {
  const result = await tripjack.seat(req.body);
  res.json(result);
};

// 9️⃣ Get Amendment Charges
exports.amendmentCharges = async (req, res) => {
  const result = await tripjack.amendmentCharges(req.body);
  res.json(result);
};

// 🔟 Submit Amendment
exports.submitAmendment = async (req, res) => {
  const result = await tripjack.submitAmendment(req.body);
  res.json(result);
};

// 1️⃣1️⃣ Amendment Details
exports.amendmentDetails = async (req, res) => {
  const result = await tripjack.amendmentDetails(req.body);
  res.json(result);
};

// 1️⃣2️⃣ Get User Detail
exports.userDetail = async (req, res) => {
  const result = await tripjack.userDetail(req.body);
  res.json(result);
};
