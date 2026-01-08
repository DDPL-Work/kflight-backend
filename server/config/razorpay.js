const Razorpay = require("razorpay");

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  console.error("❌ Razorpay ENV at load time:", {
    keyId,
    keySecretPresent: !!keySecret,
  });
  throw new Error("Razorpay keys missing at config load time");
}

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

console.log("✅ Razorpay singleton initialized");

module.exports = razorpay;
