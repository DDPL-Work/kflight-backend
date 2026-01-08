// server/controllers/flightBooking.controller.js
const mongoose = require("mongoose");
const PriceSnapshot = require("../models/PriceSnapshot.model");
const bookingService = require("../services/tripjackBookingService");
const applyPricingFromSnapshot = require("../utils/applyPricingFromSnapshot");
const transformSeatMap = require("../utils/transformSeatMap");
const BookingSeat = require("../models/BookingSeat.model");
const FlightBooking = require("../models/flight_booking.model");
const mapSSRToTripJack = require("../utils/mapSSR");
const Payment = require("../models/payment.model");
const paymentService = require("../services/paymentService");
const refundService = require("../services/refundService");
const { sendEmail, sendSMS } = require("../utils/notification");

function normalizePhone(phone) {
  if (!phone) return "+919999999999";
  if (phone.startsWith("+")) return phone;
  return `+91${phone}`;
}

function normalizeContactInfo(contactInfo = {}) {
  return {
    emails: Array.isArray(contactInfo.emails)
      ? contactInfo.emails
      : contactInfo.email
      ? [contactInfo.email]
      : ["noreply@yourdomain.com"],

    contacts: Array.isArray(contactInfo.contacts)
      ? contactInfo.contacts
      : contactInfo.mobile
      ? [normalizePhone(contactInfo.mobile)]
      : ["+919999999999"],

    ecn: contactInfo.ecn || "Primary Contact",
  };
}

function normalizeTripjackDate(date) {
  if (!date) return date;

  // If date is in "YYYY-MM-DDTHH:mm" format, append seconds
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(date)) {
    return `${date}:00`;
  }

  return date;
}


function normalizeDeliveryInfo(deliveryInfo = {}, contactInfo = {}) {
  const contact = normalizeContactInfo(contactInfo);

  return {
    emails:
      deliveryInfo?.emails?.length > 0 ? deliveryInfo.emails : contact.emails,

    contacts:
      deliveryInfo?.contacts?.length > 0
        ? deliveryInfo.contacts.map(normalizePhone)
        : contact.contacts,
  };
}

// -----------------------------
// Load valid snapshot
// -----------------------------
async function loadSnapshot(snapshotId) {
  const snap = await PriceSnapshot.findOne({
    _id: snapshotId,
    expiresAt: { $gt: new Date() },
  });

  if (!snap) throw new Error("Price snapshot expired or invalid");

  return snap;
}

// ==============================
// REVIEW FLIGHT (FIXED)
// ==============================
exports.reviewFlight = async (req, res) => {
  try {
    const { snapshotIds = [] } = req.body;

    if (!Array.isArray(snapshotIds) || !snapshotIds.length) {
      return res.status(400).json({
        success: false,
        message: "snapshotIds array is required",
      });
    }

    // --------------------------------------------------
    // 1️⃣ Load valid snapshots
    // --------------------------------------------------
    const snapshots = await PriceSnapshot.find({
      _id: { $in: snapshotIds },
      expiresAt: { $gt: new Date() },
    });

    if (snapshots.length !== snapshotIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more price snapshots expired",
      });
    }

    // --------------------------------------------------
    // 2️⃣ Build TripJack Review payload
    // --------------------------------------------------
    const priceIds = snapshots
      .sort((a, b) => a.routeIndex - b.routeIndex)
      .map((s) => s.priceId);

    const tjResp = await bookingService.reviewFlight({ priceIds });

    if (!tjResp?.status?.success) {
      return res.status(400).json({
        success: false,
        message: "TripJack review failed",
        errors: tjResp?.errors || null,
      });
    }

    const reviewData = tjResp.data || tjResp;

    // --------------------------------------------------
    // 3️⃣ Extract bookingId (CRITICAL)
    // --------------------------------------------------
    const bookingId =
      reviewData?.bookingId || tjResp?.bookingId || tjResp?.data?.bookingId;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "TripJack did not return bookingId",
      });
    }

    // --------------------------------------------------
    // 4️⃣ Extract TripJack TOTAL FARE (SUPPLIER ONLY)
    // --------------------------------------------------
    const fareDetail = reviewData?.totalPriceInfo?.totalFareDetail;

    const tripjackTotalFare =
      fareDetail?.fC?.TF ?? fareDetail?.afC?.TF ?? fareDetail?.TF;

    if (!Number.isFinite(tripjackTotalFare)) {
      console.error(
        "FULL REVIEW RESPONSE:",
        JSON.stringify(reviewData, null, 2)
      );
      throw new Error("TripJack TF missing in review response");
    }

    // --------------------------------------------------
    // 5️⃣ Recalculate ADMIN PRICE (Snapshot Rules)
    // --------------------------------------------------
    let totalFinalFare = 0;
    let fareAlert = false;
    const segmentFares = [];

    snapshots.forEach((snap, idx) => {
      const supplierFare =
        reviewData?.tripInfos?.[idx]?.totalPriceList?.[0]?.fd?.ADULT?.fC?.BF ??
        snap.supplierFare;

      if (Math.abs(supplierFare - snap.supplierFare) > 5) {
        fareAlert = true;
      }

      const finalFare = applyPricingFromSnapshot(
        supplierFare,
        snap.pricingRules
      );

      segmentFares.push(finalFare);
      totalFinalFare += finalFare;
    });

    if (reviewData?.alerts?.some((a) => a.type === "FAREALERT")) {
      fareAlert = true;
    }

    // --------------------------------------------------
    // 6️⃣ Persist REVIEW STATE (PRICE LOCK 🔒)
    // --------------------------------------------------
    await PriceSnapshot.updateMany(
      { _id: { $in: snapshotIds } },
      {
        $set: {
          isReviewed: true,
          reviewBookingId: bookingId,
          reviewedAt: new Date(),

          // Supplier price (TripJack)
          reviewedSupplierFare: tripjackTotalFare,

          // Admin price (markup applied)
          reviewedFinalFare: totalFinalFare,

          fareAlert,
          supplierReview: reviewData  
        },
      }
    );

    console.log("tripjackTotalFare:", tripjackTotalFare);

    // --------------------------------------------------
    // 7️⃣ Response
    // --------------------------------------------------
    return res.json({
      success: true,
      bookingId, // ✅ SAME bookingId used for HOLD & INSTANT
      fareAlert,
      totalFinalFare, // ADMIN price
      segmentFares,
      supplierReview: reviewData, // RAW TripJack review
    });
  } catch (err) {
    console.error("REVIEW ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// -----------------------------
// 1️⃣ Fare Rules
// -----------------------------
exports.getFareRules = async (req, res) => {
  try {
    const { snapshotId, priceId } = req.body;

    if (!snapshotId || !priceId) {
      return res.status(400).json({
        success: false,
        message: "snapshotId and priceId required",
      });
    }

    // 1️⃣ Load snapshot
    const snapshot = await PriceSnapshot.findById(snapshotId);

    if (!snapshot) {
      return res.status(404).json({
        success: false,
        message: "Snapshot not found",
      });
    }

    // 2️⃣ Decide flow dynamically
    let flowType = "SEARCH";
    let id = priceId;

    if (snapshot.reviewBookingId) {
      flowType = "REVIEW";
      id = snapshot.reviewBookingId;
    }

    if (snapshot.finalBookingId) {
      flowType = "BOOKING_DETAIL";
      id = snapshot.finalBookingId;
    }

    // 3️⃣ Call TripJack Fare Rule API
    const result = await bookingService.getFareRules({
      flowType,
      id,
    });

    if (!result?.status?.success) {
      return res.status(400).json({
        success: false,
        error: result?.errors || "Fare rules fetch failed",
      });
    }

    // 4️⃣ SUCCESS RESPONSE (IMPORTANT)
    return res.json({
      success: true,
      flowType,
      fareRules: result.farerule || result.data || result,
      pricing: {
        supplierFare: snapshot.supplierFare,
        finalFare: snapshot.finalFare,
        markupApplied: snapshot.finalFare - snapshot.supplierFare,
        pricingRules: snapshot.pricingRules || [],
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// -----------------------------
// 2️⃣ Seat Map
// -----------------------------
exports.getSeatMap = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res
        .status(400)
        .json({ success: false, message: "bookingId required" });
    }

    const result = await bookingService.getSeatMap({ bookingId });

    // 🚨 CRITICAL CHECK
    if (!result?.status?.success) {
      return res.status(400).json({
        success: false,
        error: result?.errors || "Seat map fetch failed",
      });
    }

    // Seat map may exist but be empty (valid case)
    const tripSeat = result?.tripSeatMap?.tripSeat || null;
    const normalizedSeats = transformSeatMap(tripSeat);

    return res.json({
      success: true,
      seatAvailable: normalizedSeats.length > 0,
      data: normalizedSeats,
    });
  } catch (err) {
    console.error("SEAT MAP ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// -----------------------------
// -----------------------------
// 3️⃣ Fare Validate (HOLD PNR ONLY)
// -----------------------------
exports.validateFare = async (req, res) => {
  const { bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).json({
      success: false,
      message: "bookingId required",
    });
  }

  const response = await bookingService.validateFare({ bookingId });

  if (!response?.status?.success) {
    return res.status(409).json({
      success: false,
      message: "Fare no longer available or hold expired",
      errors: response?.errors,
    });
  }

  res.json({
    success: true,
    message: "Fare validated successfully",
  });
};

// -----------------------------
// HOLD BOOKING (NO PAYMENT)
// -----------------------------
exports.holdBooking = async (req, res) => {
  try {
    const { snapshotId, travellerInfo, contactInfo, deliveryInfo, gstInfo } =
      req.body;

    // --------------------------------------------------
    // 0️⃣ Basic validation
    // --------------------------------------------------
    if (!snapshotId || !Array.isArray(travellerInfo) || !travellerInfo.length) {
      return res.status(400).json({
        success: false,
        message: "snapshotId and travellerInfo are required",
      });
    }

    // --------------------------------------------------
    // 1️⃣ Load snapshot (must be reviewed)
    // --------------------------------------------------
    const snapshot = await PriceSnapshot.findOne({
      _id: snapshotId,
      expiresAt: { $gt: new Date() },
    });

    if (!snapshot) {
      return res.status(400).json({
        success: false,
        message: "Snapshot expired or invalid",
      });
    }

    if (!snapshot.isReviewed || !snapshot.reviewBookingId) {
      return res.status(409).json({
        success: false,
        message: "Review required before hold",
      });
    }

    // ✅ Already held
    if (snapshot.isHeld) {
      return res.json({
        success: true,
        bookingId: snapshot.reviewBookingId,
        status: "HOLD",
        reused: true,
      });
    }

    const bookingId = snapshot.reviewBookingId;

    // --------------------------------------------------
    // 2️⃣ Normalize payload
    // --------------------------------------------------
    let safeTravellers = mapTravellersForTripJack(travellerInfo);

    safeTravellers = mapSSRToTripJack(
      safeTravellers,
      snapshot.supplierReview,
      travellerInfo
    );

    const safeContact = normalizeContactInfo(contactInfo);

    const safeDelivery =
      deliveryInfo ||
      normalizeDeliveryInfo(
        deliveryInfo,
        safeContact
      );

    // --------------------------------------------------
    // 3️⃣ HOLD CALL (NO PAYMENT)
    // --------------------------------------------------
    const holdResp = await bookingService.holdBooking({
      bookingId,
      travellerInfo: safeTravellers,
      contactInfo: safeContact,
      deliveryInfo: safeDelivery,
      gstInfo,
    });

    // --------------------------------------------------
    // 4️⃣ DUPLICATE HOLD = SUCCESS
    // --------------------------------------------------
    if (!holdResp?.status?.success) {
      const duplicateErr = holdResp?.errors?.find(
        (e) => e.errCode === "2502"
      );

      if (duplicateErr?.details) {
        const existingBookingId = duplicateErr.details;

        await PriceSnapshot.updateOne(
          { _id: snapshot._id },
          {
            $set: {
              reviewBookingId: existingBookingId,
              heldAt: new Date(),
              isHeld: true,
            },
          }
        );

        return res.json({
          success: true,
          bookingId: existingBookingId,
          status: "HOLD",
          reused: true,
        });
      }

      return res.status(400).json({
        success: false,
        message: "Hold failed",
        errors: holdResp?.errors || null,
      });
    }

    // --------------------------------------------------
    // 5️⃣ SUCCESS → MARK SNAPSHOT AS HELD
    // --------------------------------------------------
    await PriceSnapshot.updateOne(
      { _id: snapshot._id },
      {
        $set: {
          heldAt: new Date(),
          isHeld: true,
        },
      }
    );

    return res.json({
      success: true,
      bookingId,
      status: "HOLD",
    });
  } catch (err) {
    console.error("HOLD ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.createPaymentOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const snapshot = await PriceSnapshot.findOne({
      reviewBookingId: bookingId,
    });

    if (!snapshot) throw new Error("Snapshot not found");

    // 🔁 Reuse existing CREATED order
    const existing = await Payment.findOne({
      bookingId,
      status: "CREATED",
    });

    if (existing) {
      return res.json({
        success: true,
        razorpayOrderId: existing.razorpayOrderId,
        amount: existing.amount,
        reused: true,
      });
    }

    const seats = await BookingSeat.find({ bookingId });
    const seatTotal = seats.reduce((s, x) => s + (x.price || 0), 0);

    const finalAmount = snapshot.reviewedFinalFare + seatTotal;

    const order = await paymentService.createOrder({
      bookingId,
      amount: finalAmount,
      currency: "INR",
    });

    await Payment.create({
      bookingId,
      snapshotId: snapshot._id,
      amount: finalAmount,
      currency: "INR",
      gateway: "razorpay",
      razorpayOrderId: order.id,
    });

    res.json({
      success: true,
      razorpayOrderId: order.id,
      amount: finalAmount,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};



exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const valid = paymentService.verifySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!valid) throw new Error("Invalid payment signature");

    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "PAID",
        paidAt: new Date(),
      }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};



function mapTravellersForTripJack(travellers) {
  return travellers.map((t, idx) => {
    if (!t.pt) {
      throw new Error(`Passenger type missing at index ${idx}`);
    }

    const pt = t.pt.toUpperCase();
    if (!["ADULT", "CHILD", "INFANT"].includes(pt)) {
      throw new Error(`Invalid passenger type at index ${idx}`);
    }

    if (!t.fN || !t.lN) {
      throw new Error(`Passenger name missing at index ${idx}`);
    }

    if (pt !== "ADULT" && !t.dob) {
      throw new Error(`DOB required for ${pt} at index ${idx}`);
    }

    return {
      ti: (t.ti || "Mr").replace(".", "").trim(),
      pt,

      fN: t.fN.replace(/[^A-Za-z]/g, "").toUpperCase(),
      lN: t.lN.replace(/[^A-Za-z]/g, "").toUpperCase(),

      dob: pt === "ADULT" ? null : t.dob,

      pNum: t.passportNumber || null,
      eD: t.passportExpiry || null,
      pNat: t.passportNationality || null,
      pid: t.passportIssueDate || null,
      di: t.documentId || null,

      ssrBaggageInfos: [],
      ssrMealInfos: [],
      ssrSeatInfos: [],
      ssrExtraServiceInfos: [],
    };
  });
}

function sanitizeGstInfo(gstInfo) {
  if (!gstInfo?.gstNumber) return null;

  return {
    registeredName: gstInfo.registeredName,
    gstNumber: gstInfo.gstNumber,
    email: gstInfo.email,
    mobile: normalizePhone(gstInfo.mobile),
    address: gstInfo.address,
  };
}


// -----------------------------
// INSTANT BOOK FLIGHT (FIXED)
// -----------------------------

exports.instantBookFlight = async (req, res) => {
  let session;

  try {
    const { snapshotId, travellers, deliveryInfo, contactInfo, gstInfo } =
      req.body;

    if (!snapshotId || !Array.isArray(travellers) || !travellers.length) {
      return res.status(400).json({
        success: false,
        message: "snapshotId and travellers are required",
      });
    }

    // --------------------------------------------------
    // 1️⃣ Load snapshot (NO TRANSACTION YET)
    // --------------------------------------------------
    const snapshot = await PriceSnapshot.findById(snapshotId);

    if (!snapshot) throw new Error("Price snapshot not found");
    if (snapshot.expiresAt <= new Date())
      throw new Error("Price snapshot expired");
    if (!snapshot.isReviewed || !snapshot.reviewBookingId)
      throw new Error("Review required before instant booking");

    const bookingId = snapshot.reviewBookingId;

    // --------------------------------------------------
    // 2️⃣ PAYMENT CHECK (CRITICAL FIX)
    // --------------------------------------------------
    const payment = await Payment.findOne({
      bookingId,
      status: "PAID",
      refundStatus: { $ne: "COMPLETED" },
    });

    if (!payment) {
      throw new Error("Payment required before instant booking");
    }

    // --------------------------------------------------
    // 3️⃣ START TRANSACTION (ONLY NOW)
    // --------------------------------------------------
    session = await mongoose.startSession();
    session.startTransaction();

    // --------------------------------------------------
    // 4️⃣ Reuse booking if already booked (IDEMPOTENT)
    // --------------------------------------------------
    if (snapshot.finalBookingId) {
      await session.commitTransaction();
      session.endSession();

      return res.json({
        success: true,
        bookingId: snapshot.finalBookingId,
        pnr: snapshot.pnr || null,
        status: "BOOKED",
        reused: true,
      });
    }

    // --------------------------------------------------
    // 5️⃣ Normalize payload
    // --------------------------------------------------
    let safeTravellers = mapTravellersForTripJack(travellers);

    safeTravellers = mapSSRToTripJack(
      safeTravellers,
      snapshot.supplierReview,
      {} // 🔒 no SSR during instant booking
    );

    const safeContact = normalizeContactInfo(contactInfo);
    const safeDelivery = normalizeDeliveryInfo(deliveryInfo, safeContact);
    const safeGst = sanitizeGstInfo(gstInfo);

    // --------------------------------------------------
    // 6️⃣ TripJack Instant Booking
    // --------------------------------------------------
    const bookResp = await bookingService.instantBookFlight({
      bookingId,
      amount: snapshot.reviewedSupplierFare, // supplier fare ONLY
      travellerInfo: safeTravellers,
      deliveryInfo: safeDelivery,
      contactInfo: safeContact,
      gstInfo: safeGst,
    });

    let finalBookingId;
    let pnr = null;

    if (!bookResp?.status?.success) {
      const duplicateErr = bookResp?.errors?.find(
        (e) => e.errCode === "2502"
      );

      if (duplicateErr?.details) {
        finalBookingId = duplicateErr.details;
      } else {
        console.error("TRIPJACK ERROR:", bookResp?.errors);
        throw new Error("TripJack instant booking failed");
      }
    } else {
      finalBookingId =
        bookResp.bookingId || bookResp.data?.bookingId;

      pnr = bookResp.pnr || bookResp.data?.pnr || null;
    }

    // --------------------------------------------------
    // 7️⃣ Persist booking
    // --------------------------------------------------
    await PriceSnapshot.updateOne(
      { _id: snapshot._id },
      {
        $set: {
          finalBookingId,
          bookedAt: new Date(),
          pnr,
        },
      },
      { session }
    );

    await FlightBooking.create(
      [
        {
          snapshotId,
          searchSessionId: snapshot.searchSessionId,
          bookingId: finalBookingId,
          pnr,
          travellers: safeTravellers,
          deliveryInfo: safeDelivery,
          contactInfo: safeContact,
          gstInfo: safeGst,
          status: "BOOKED",
          bookedAt: new Date(),
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.json({
      success: true,
      bookingId: finalBookingId,
      pnr,
      status: "BOOKED",
      supplierResponse: bookResp,
    });
  } catch (err) {
    // --------------------------------------------------
    // 8️⃣ SAFE TRANSACTION CLEANUP
    // --------------------------------------------------
    if (session) {
      try {
        await session.abortTransaction();
        session.endSession();
      } catch (_) {}
    }

    // --------------------------------------------------
    // 9️⃣ AUTO REFUND IF PAYMENT EXISTS
    // --------------------------------------------------
    let refunded = false;

    try {
      const snapshot = await PriceSnapshot.findById(req.body.snapshotId);

      if (snapshot?.reviewBookingId) {
        const payment = await Payment.findOne({
          bookingId: snapshot.reviewBookingId,
          status: "PAID",
          refundStatus: { $ne: "COMPLETED" },
        });

        if (payment) {
          const refund = await refundService.refundPayment({
            paymentId: payment.razorpayPaymentId,
            amount: payment.amount,
            reason: "TripJack booking failed",
          });

          await Payment.updateOne(
            { _id: payment._id },
            {
              refundStatus: "COMPLETED",
              refundId: refund.id,
              refundedAt: new Date(),
            }
          );

          refunded = true;
        }
      }
    } catch (refundErr) {
      console.error("REFUND FAILED:", refundErr);
    }

    return res.status(400).json({
      success: false,
      message: err.message,
      refunded,
    });
  }
};


exports.saveSeatSelection = async (req, res) => {
  const { bookingId, seats } = req.body;

  // 1️⃣ Basic validation
  if (!bookingId || !Array.isArray(seats) || !seats.length) {
    return res.status(400).json({
      success: false,
      message: "bookingId and seats are required",
    });
  }

  // =====================================================
  // 2️⃣ VALIDATE SEATS USING NORMALIZED SEAT MAP (CORRECT)
  // =====================================================
  const seatMapResp = await bookingService.getSeatMap({ bookingId });

  if (!seatMapResp?.status?.success) {
    return res.status(400).json({
      success: false,
      message: "Unable to fetch seat map from supplier",
    });
  }

  // ✅ USE SAME TRANSFORMER AS UI
  const tripSeatRaw = seatMapResp?.tripSeatMap?.tripSeat || null;
  const normalizedSeats = transformSeatMap(tripSeatRaw);

  // Build lookup: segmentId → seatCoden
  const validSeats = new Set();

  normalizedSeats.forEach((segment) => {
    segment.seats.forEach((seat) => {
      if (!seat.isBooked) {
        validSeats.add(`${segment.segmentId}:${seat.code}`);
      }
    });
  });

  if (!validSeats.size) {
    return res.status(400).json({
      success: false,
      message: "No selectable seats available for this booking",
    });
  }

  // Validate requested seats
  for (const seat of seats) {
    const key = `${seat.segmentId}:${seat.seatCode}`;
    if (!validSeats.has(key)) {
      return res.status(400).json({
        success: false,
        message: `Invalid or unavailable seat: ${seat.seatCode}`,
      });
    }
  }

  // =====================================================
  // 2️⃣ END OF INSERTED BLOCK
  // =====================================================

  // 3️⃣ Only now touch DB
  await BookingSeat.deleteMany({ bookingId });

  const expiry = new Date(Date.now() + 10 * 60 * 1000);

  const sanitizedSeats = seats.map((s) => ({
    bookingId,
    travellerIndex: s.travellerIndex,
    segmentId: s.segmentId,
    seatCode: s.seatCode,
    price: Number(s.price) || 0,
    expiresAt: expiry,
  }));

  await BookingSeat.insertMany(sanitizedSeats);

  res.json({ success: true });
};





// -----------------------------
// RELEASE HOLD / PNR
// -----------------------------
exports.releasePNR = async (req, res) => {
  try {
    const { bookingId, pnrs } = req.body;

    // 1️⃣ Validation
    if (!bookingId || !Array.isArray(pnrs) || !pnrs.length) {
      return res.status(400).json({
        success: false,
        message: "bookingId and pnrs array are required",
      });
    }

    // 2️⃣ Call TripJack Release PNR
    const response = await bookingService.releasePNR({ bookingId, pnrs });

    if (!response?.status?.success) {
      return res.status(400).json({
        success: false,
        message: "Failed to release PNR",
        errors: response?.errors || null,
      });
    }

    // 3️⃣ Optional: Update DB
    await FlightBooking.updateOne(
      { bookingId },
      {
        $set: {
          releasedAt: new Date(),
          pnrsReleased: pnrs,
          releaseResponse: response,
        },
      }
    );

    // 4️⃣ Return success
    return res.json({
      success: true,
      bookingId,
      releasedPnrs: pnrs,
      response,
    });
  } catch (err) {
    console.error("RELEASE PNR ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.bookAndConfirmFlight = async (req, res) => {
  
  try {
    const { bookingId } = req.body;

const payment = await Payment.findOne({
  bookingId,
  status: "PAID",
  refundStatus: { $ne: "COMPLETED" },
});


if (!payment) {
  throw new Error("Payment not completed for this booking");
}

    // ----------------------------------------------------
    // 0️⃣ VALIDATION (TripJack rule)
    // ----------------------------------------------------
    if (!bookingId) {
      throw new Error("bookingId is required for confirm");
    }

    // ----------------------------------------------------
    // 1️⃣ LOAD SNAPSHOT USING bookingId (SERVER TRUST)
    // ----------------------------------------------------
 const snapshot = await PriceSnapshot.findOneAndUpdate(
  {
    reviewBookingId: bookingId,
    $or: [
      { confirmingAt: { $exists: false } },
      { confirmingAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) } },
    ],
  },
  { $set: { confirmingAt: new Date() } },
  { new: true }
);

if (!snapshot) {
  throw new Error("Booking already confirmed or in progress");
}


 // ----------------------------------------------------
    // 6️⃣ FINAL PRICE (ADMIN / CUSTOMER)
    // ----------------------------------------------------
    const seatSelections = await BookingSeat.find({ bookingId });
    const seatTotal = seatSelections.reduce(
      (sum, s) => sum + (s.price || 0),
      0
    );

    const finalFare = snapshot.reviewedFinalFare + seatTotal;
    
    // Idempotency
    if (snapshot.finalBookingId) {
      return res.json({
        success: true,
        bookingId: snapshot.finalBookingId,
        pnr: snapshot.pnr || null,
        status: "TICKETED",
        reused: true,
      });
    }

    // ----------------------------------------------------
    // 2️⃣ VERIFY BOOKING STATUS
    // ----------------------------------------------------
    const detailsBefore = await bookingService.getBookingDetails({ bookingId });

    const bookingStatus =
      detailsBefore?.order?.status || detailsBefore?.status;

    if (!["UNCONFIRMED", "ON_HOLD"].includes(bookingStatus)) {
      throw new Error(
        `Booking cannot be confirmed. Current status: ${bookingStatus}`
      );
    }

    // ----------------------------------------------------
    // 3️⃣ FARE VALIDATION (MANDATORY)
    // ----------------------------------------------------
    const fareValidate = await bookingService.validateFare({ bookingId });

    if (!fareValidate?.status?.success) {
      console.error("Fare Validate Error:", fareValidate?.errors);
      throw new Error("Fare validation failed");
    }

    // ----------------------------------------------------
    // 4️⃣ CONFIRM BOOKING (TripJack FORMAT)
    // ----------------------------------------------------
    const confirmPayload = {
      bookingId,
      paymentInfos: [
        {
          amount: snapshot.reviewedSupplierFare, // 🔒 supplier fare only
        },
      ],
    };

    const confirm = await bookingService.confirmBooking(confirmPayload);

    if (!confirm?.status?.success) {
      console.error("Confirm Booking Error:", confirm?.errors);
      throw new Error("Confirm booking failed");
    }

    // ----------------------------------------------------
    // 5️⃣ POLL FOR TICKETING
    // ----------------------------------------------------
    let finalDetails;
    let finalStatus;

    for (let i = 0; i < 5; i++) {
      finalDetails = await bookingService.getBookingDetails({ bookingId });
      finalStatus = finalDetails?.order?.status;

      if (finalStatus === "SUCCESS") break;
      await new Promise((r) => setTimeout(r, 2000));
    }

    if (finalStatus !== "SUCCESS") {
      throw new Error("Ticket not issued yet, retry later");
    }

    const pnr = finalDetails?.order?.pnr || null;

   

    // ----------------------------------------------------
    // 7️⃣ PERSIST FINAL BOOKING
    // ----------------------------------------------------
    await PriceSnapshot.updateOne(
      { _id: snapshot._id },
      {
        $set: {
          finalBookingId: bookingId,
          bookedAt: new Date(),
          pnr,
        },
      }
    );

    await FlightBooking.create({
      snapshotId: snapshot._id,
      searchSessionId: snapshot.searchSessionId,
      bookingId,
      pnr,
      finalFare,
      status: "TICKETED",
      bookedAt: new Date(),
    });

// ==============================
// 📧📱 SEND EMAIL & SMS (ASYNC)
// ==============================
try {
  const email =
    snapshot?.supplierReview?.deliveryInfo?.emails?.[0] ||
    snapshot?.supplierReview?.contactInfo?.emails?.[0];

  const mobile =
    snapshot?.supplierReview?.deliveryInfo?.contacts?.[0] ||
    snapshot?.supplierReview?.contactInfo?.contacts?.[0];

const alreadySent = await FlightBooking.findOne({ 
  bookingId,
  notificationSent: true,
});

if (alreadySent) return;

  // ------------------------------
  // 📧 EMAIL
  // ------------------------------
  if (email) {
    sendEmail({
      to: email,
      subject: "✈️ Flight Ticket Confirmed",
      html: `
        <h2>Booking Confirmed 🎉</h2>
        <p><strong>PNR:</strong> ${pnr}</p>
        <p><strong>Booking ID:</strong> ${bookingId}</p>
        <p><strong>Total Fare:</strong> ₹${finalFare}</p>
        <p>Your ticket has been successfully booked.</p>
        <br/>
        <p>Thank you for choosing us ✨</p>
      `,
    });
  }

  // ------------------------------
  // 📱 SMS
  // ------------------------------
  if (mobile) {
    await sendSMS(
      mobile.replace("+", "")
    );
  }
} catch (notifyErr) {
  // ❗ Never fail booking because of notification
  console.error("NOTIFICATION ERROR:", notifyErr.message);
}


    // ----------------------------------------------------
    // 8️⃣ CLEANUP TEMP DATA
    // ----------------------------------------------------
    await BookingSeat.deleteMany({ bookingId });

    return res.json({
      success: true,
      bookingId,
      pnr,
      finalFare,
      status: "TICKETED",
    });
  } catch (err) {
    console.error("CONFIRM BOOK ERROR:", err);
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};




// -----------------------------
// 5️⃣ Booking Details (TripJack aligned)
// -----------------------------
exports.getBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "bookingId is required",
      });
    }

    const tjResp = await bookingService.getBookingDetails({ bookingId });

    if (!tjResp?.status?.success) {
      return res.status(400).json({
        success: false,
        message: "Failed to fetch booking details",
        errors: tjResp?.errors || null,
      });
    }

    // Extract normalized PNRs
    const pnrDetails = tjResp?.travellerInfos?.reduce((acc, t) => {
      Object.entries(t.pnrDetails || {}).forEach(([segment, pnr]) => {
        acc[segment] = pnr;
      });
      return acc;
    }, {});

    const ticketNumbers = tjResp?.travellerInfos?.reduce((acc, t) => {
      Object.entries(t.ticketNumberDetails || {}).forEach(
        ([segment, ticket]) => {
          acc[segment] = ticket;
        }
      );
      return acc;
    }, {});

    // Optional: Save full response in DB
    await FlightBooking.updateOne(
      { bookingId },
      {
        $set: {
          notificationSent: true,
          bookingDetails: tjResp,
          pnrDetails,
          ticketNumbers,
          pnrFetchedAt: new Date(),
        },
      }
    );

    return res.json({
      success: true,
      data: tjResp,
      pnrDetails,
      ticketNumbers,
    });
  } catch (err) {
    console.error("BOOKING DETAILS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// -----------------------------
// Amendment / Cancellation Flow
// -----------------------------

// 1️⃣ Get Cancellation Charges (Optional)
exports.getCancellationCharges = async (req, res) => {
  try {
    const { bookingId, trips } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "bookingId is required",
      });
    }

    const response = await bookingService.getAmendmentCharges({
      bookingId,
      type: "CANCELLATION",
      remarks: "User requested cancellation charges",
      trips, // optional
    });

    return res.json({
      success: true,
      data: response,
    });
  } catch (err) {
    console.error("AMENDMENT CHARGES ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2️⃣ Submit Cancellation
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId, trips } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "bookingId is required",
      });
    }

    // Normalize departureDate
    let normalizedTrips = trips;
    if (trips?.length) {
      normalizedTrips = trips.map(trip => ({
        ...trip,
        departureDate: normalizeTripjackDate(trip.departureDate),
      }));
    }

    const response = await bookingService.submitAmendment({
      bookingId,
      type: "CANCELLATION",
      remarks: "User requested booking cancellation",
      trips: normalizedTrips,
    });

    if (!response?.amendmentId) {
      return res.status(400).json({
        success: false,
        message: "Failed to submit cancellation",
        response,
      });
    }

    return res.json({
      success: true,
      amendmentId: response.amendmentId,
      bookingId: response.bookingId,
      status: "REQUESTED",
    });
  } catch (err) {
    console.error("SUBMIT AMENDMENT ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


// 3️⃣ Get Cancellation / Amendment Status (with optional polling)
exports.getCancellationStatus = async (req, res) => {
  try {
    const { amendmentId } = req.body;

    if (!amendmentId) {
      return res.status(400).json({
        success: false,
        message: "amendmentId is required",
      });
    }

    const response = await bookingService.getAmendmentDetails({
      amendmentId,
    });

    return res.json({
      success: true,
      data: response,
    });
  } catch (err) {
    console.error("AMENDMENT STATUS ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
