const Payment = require("../models/payment.model");
const refundService = require("../services/refundService");

exports.processCancellationRefund = async (req, res) => {
  try {
    const { bookingId, refundableAmount } = req.body;

    const payment = await Payment.findOne({
      bookingId,
      status: "PAID",
      refundStatus: { $ne: "COMPLETED" },
    });

    if (!payment) {
      return res.status(400).json({
        success: false,
        message: "No refundable payment found",
      });
    }

    const refund = await refundService.refundPayment({
      paymentId: payment.razorpayPaymentId,
      amount: refundableAmount,
      reason: "Flight cancellation refund",
    });

    await Payment.updateOne(
      { _id: payment._id },
      {
        refundStatus: "COMPLETED",
        refundId: refund.id,
        refundedAmount: refundableAmount,
        refundedAt: new Date(),
      }
    );

    res.json({
      success: true,
      refundId: refund.id,
      refundedAmount: refundableAmount,
    });
  } catch (err) {
    console.error("REFUND ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
