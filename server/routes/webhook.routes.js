const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const Payment = require("../models/payment.model");
const PriceSnapshot = require("../models/PriceSnapshot.model");

router.post(
  "/razorpay",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

      const signature = req.headers["x-razorpay-signature"];
      const body = req.body.toString();

      const expected = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

      if (expected !== signature) {
        return res.status(400).send("Invalid signature");
      }

      const event = JSON.parse(body);

      if (event.event === "payment.captured") {
        const paymentId = event.payload.payment.entity.id;
        const orderId = event.payload.payment.entity.order_id;

        const payment = await Payment.findOneAndUpdate(
          { razorpayOrderId: orderId },
          {
            razorpayPaymentId: paymentId,
            status: "PAID",
            paidAt: new Date(),
            webhookPayload: event,
          },
          { new: true }
        );

        if (payment) {
          await PriceSnapshot.updateOne(
            { _id: payment.snapshotId },
            { $set: { paymentConfirmedAt: new Date() } }
          );
        }
      }

      res.json({ success: true });
    } catch (err) {
      console.error("WEBHOOK ERROR:", err);
      res.status(500).send("Webhook error");
    }
  }
);

module.exports = router;
