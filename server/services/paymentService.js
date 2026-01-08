// server/services/paymentService.js
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ⚠️ IMPORTANT: Promise-only, NO callbacks
exports.createOrder = async ({ bookingId, amount, currency }) => {
  return razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency,
    receipt: `rcpt_${bookingId}`,
    notes: { bookingId },
  });
};

exports.verifySignature = ({ orderId, paymentId, signature }) => {
  const body = `${orderId}|${paymentId}`;

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  return expected === signature;
};
