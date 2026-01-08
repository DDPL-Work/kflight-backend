const crypto = require('crypto');
const axios = require('axios');
const Booking = require('../models/booking.model');

const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    const bodyString = Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(bodyString)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.log('❌ Invalid Razorpay signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = typeof req.body === 'string'
      ? JSON.parse(req.body)
      : req.body;

    console.log('✅ Razorpay Webhook Event:', event.event);

    switch (event.event) {
      case 'payment.captured':
        await handleSuccessfulPayment(event.payload.payment.entity);
        break;
      case 'payment.failed':
        await handleFailedPayment(event.payload.payment.entity);
        break;
      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    next(error);
  }
};

const handleStripeWebhook = async (req, res, next) => {
  try {
    // placeholder - you can fill this later
    console.log("✅ Stripe webhook received");
    res.json({ received: true });
  } catch (error) {
    next(error);
  }
};

const handleSuccessfulPayment = async (paymentData) => {
  const orderId = paymentData.order_id || paymentData.id;
  const booking = await Booking.findOne({ 'payment.orderId': orderId });

  if (booking && booking.status !== 'confirmed') {
    booking.payment.status = 'completed';
    booking.payment.paymentId = paymentData.id;
    booking.status = 'confirmed';
    booking.ticketedAt = new Date();

    await booking.save();
    await issueTickets(booking);
  }
};

const handleFailedPayment = async (paymentData) => {
  const orderId = paymentData.order_id || paymentData.id;
  const booking = await Booking.findOne({ 'payment.orderId': orderId });

  if (booking) {
    booking.payment.status = 'failed';
    booking.status = 'payment_failed';
    await booking.save();
  }
};

const issueTickets = async (booking) => {
  if (booking.ticketNumber) return { success: true, alreadyIssued: true };

  try {
    const response = await axios.post(
      `${process.env.TRIPJACK_API_URL}/issue-ticket`,
      {
        bookingId: booking.bookingId,
        flightDetails: booking.flightDetails,
        passengers: booking.passengers,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.TRIPJACK_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    booking.ticketNumber = response.data.ticketNumber;
    booking.pnr = response.data.pnr;
    booking.status = 'ticketed';
    booking.ticketedAt = new Date();
    await booking.save();

    return { success: true };
  } catch (error) {
    console.error('Ticket issuance failed:', error.message);
    booking.status = 'ticketing_failed';
    await booking.save();
    return { success: false, error: error.message };
  }
};

module.exports = { handleRazorpayWebhook, handleStripeWebhook };
