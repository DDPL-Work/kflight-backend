const crypto = require("crypto");
const Booking = require("../models/booking.model.js");
const razorpay = require("../config/razorpay");
console.log("🔥 Razorpay in controller:", razorpay);
console.log("razorpay.orders at import time:", razorpay.orders);

const createOrder = async (req, res) => {
  try {
    const { amount, bookingType, bookingDetails, userId } = req.body;

    if (!bookingDetails?.bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID missing",
      });
    }

    const booking = await Booking.findOne({
      bookingId: bookingDetails.bookingId,
    });

    // 🔒 PAYMENT ALREADY DONE — HARD STOP
    if (booking?.paymentStatus === "SUCCESS") {
      return res.status(409).json({
        success: false,
        alreadyPaid: true,
        message: "Payment already completed for this booking",
        bookingId: booking._id,
      });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount",
      });
    }

    const payableAmount = Math.round(Number(amount) * 100);

    const upsertedBooking = await Booking.findOneAndUpdate(
      { bookingId: bookingDetails.bookingId },
      {
        $setOnInsert: {
          userId,
          bookingType,
          bookingDetails,
          amount: Number(amount),
          currency: "INR",
          paymentStatus: "Pending",
        },
      },
      { new: true, upsert: true }
    );

    // 🔁 REUSE EXISTING ORDER IF CREATED
    if (upsertedBooking.razorpay_order_id) {
      return res.json({
        success: true,
        reused: true,
        bookingId: upsertedBooking.bookingId,
      });
    }

    // 🆕 CREATE ORDER
    const order = await razorpay.orders.create({
      amount: payableAmount,
      currency: "INR",
      receipt: `rcpt_${upsertedBooking.bookingId}`,
    });

    upsertedBooking.razorpay_order_id = order.id;
    await upsertedBooking.save();

    return res.json({
      success: true,
      order,
      bookingId: upsertedBooking.bookingId,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("❌ Create order error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId, // TripJack bookingId (TJS...)
    } = req.body;

    // ✅ FIX: QUERY BY bookingId FIELD
    const booking = await Booking.findOne({ bookingId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // 🔒 IDEMPOTENCY
    if (booking.paymentStatus === "SUCCESS") {
      return res.json({
        success: true,
        message: "Payment already verified",
        booking,
      });
    }

    // 🔐 Signature validation
    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // ✅ UPDATE PAYMENT STATE
    booking.paymentStatus = "SUCCESS";
    booking.razorpay_payment_id = razorpay_payment_id;
    booking.razorpay_signature = razorpay_signature;
    booking.paidAt = new Date();

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      booking,
    });
  } catch (error) {
    console.error("❌ Verify payment error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = { createOrder, verifyPayment };
