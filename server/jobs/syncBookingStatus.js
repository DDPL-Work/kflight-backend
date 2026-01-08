const Booking = require("../models/Booking.model");
const bookingService = require("../services/tripjackBookingService");

async function syncTicketStatus() {
  const pending = await Booking.find({
    status: "TICKETED",
    supplierPNR: { $exists: false }
  });

  for (const b of pending) {
    const details = await bookingService.getBookingDetails({
      bookingId: b.bookingId
    });

    const pnr = details?.data?.pnr;
    const tickets = details?.data?.ticketNumbers;

    if (pnr) {
      await Booking.updateOne(
        { bookingId: b.bookingId },
        {
          supplierPNR: pnr,
          ticketNumbers: tickets || []
        }
      );
    }
  }
}

module.exports = syncTicketStatus;
