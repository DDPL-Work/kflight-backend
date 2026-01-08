const Razorpay = require("razorpay");

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error("❌ Razorpay environment variables missing");
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.refundPayment = async ({ paymentId, amount, reason }) => {
  return razorpay.payments.refund(paymentId, {
    amount: Math.round(amount * 100),
    notes: { reason },
  });
};
