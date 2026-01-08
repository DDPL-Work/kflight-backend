const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const { MoneySchema, ContactSchema } = require("./common");

// Traveller schema
const TravellerSchema = new Schema(
  {
    type: { type: String, enum: ["ADT", "CHD", "INF"], required: true },
    title: { type: String, trim: true },
    firstName: String,
    lastName: String,
    dob: Date,
    passportNo: String,
    nationality: String,
  },
  { _id: false }
);

// Line item (price breakdown)
const LineItemSchema = new Schema(
  {
    kind: {
      type: String,
      enum: ["base", "tax", "fee", "markup", "platform_fee", "refund_add_on"],
      required: true,
    },
    label: { type: String },
    amount: { type: MoneySchema, required: true },
  },
  { _id: false }
);

// Payment summary
const PaymentSummarySchema = new Schema(
  {
    total: { type: MoneySchema, required: true },
    currencyRate: { type: Number },
    breakdown: [LineItemSchema],
  },
  { _id: false }
);

// Flight segment
const FlightSegmentSchema = new Schema(
  {
    carrier: String,
    flightNumber: String,
    from: String,
    to: String,
    departAt: Date,
    arriveAt: Date,
    pnr: String,
    ticketNumber: String,
  },
  { _id: false }
);

// Hotel stay
const HotelStaySchema = new Schema(
  {
    hotelId: String,
    name: String,
    city: String,
    checkIn: Date,
    checkOut: Date,
    rooms: Number,
    pnr: String,
    voucherNumber: String,
  },
  { _id: false }
);

// Main booking schema
const BookingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    productType: {
      type: String,
      enum: ["flight", "hotel"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "initiated",
        "confirmed",
        "ticketed",
        "cancelled",
        "refunded",
        "failed",
      ],
      default: "initiated",
      index: true,
    },
    contact: { type: ContactSchema, required: true },
    travellers: [TravellerSchema],

    flightSegments: [FlightSegmentSchema],
    hotelStay: { type: HotelStaySchema },

    supplier: { type: String, default: "tripjack" },
    supplierRefs: {
      searchId: String,
      orderId: String,
      pnr: String,
    },

    pricingAppliedRuleIds: [
      { type: Schema.Types.ObjectId, ref: "PricingRule" },
    ],
    paymentSummary: { type: PaymentSummarySchema, required: true },

    latestCancellationRequestId: {
      type: Schema.Types.ObjectId,
      ref: "CancellationRequest",
    },
    latestRefundId: { type: Schema.Types.ObjectId, ref: "Refund" },
  },
  { timestamps: true }
);

BookingSchema.index({ createdAt: -1 });

const Booking = model("Booking", BookingSchema);

module.exports = { Booking };
