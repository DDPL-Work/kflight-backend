const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const Booking = require("../models/booking.model");

exports.downloadTicket = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // 🔒 Payment enforcement
    if (booking.paymentStatus !== "SUCCESS") {
      return res.status(403).json({
        message: "Payment not completed. Ticket unavailable.",
      });
    }

    const air = booking.bookingDetails?.itemInfos?.AIR;
    if (!air) {
      return res.status(400).json({ message: "Invalid booking data" });
    }

    /* ---------------- RESPONSE HEADERS ---------------- */
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Flight-Ticket-${bookingId}.pdf`
    );

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    doc.pipe(res);

    /* ---------------- HEADER ---------------- */
    doc
      .fontSize(20)
      .text("E-Ticket / Itinerary", { align: "center" })
      .moveDown(0.5);

    doc
      .fontSize(11)
      .text(`Booking ID: ${bookingId}`)
      .text(`Payment Status: ${booking.paymentStatus}`)
      .moveDown();

    /* ---------------- QR CODE ---------------- */
    const qrPayload = JSON.stringify({
      bookingId,
      passengers: air.travellerInfos.length,
      route: air.tripInfos[0].sI[0].da.code + "-" +
             air.tripInfos[0].sI[0].aa.code,
    });

    const qrImage = await QRCode.toDataURL(qrPayload);

    doc.image(qrImage, 430, 60, { width: 100 });
    doc.moveDown(2);

    /* ---------------- PASSENGERS ---------------- */
    doc.fontSize(14).text("Passenger Details", { underline: true });

    air.travellerInfos.forEach((t, i) => {
      doc
        .fontSize(11)
        .text(
          `${i + 1}. ${t.ti} ${t.fN} ${t.lN}  |  Ticket: ${
            t.ticketNumber || "Pending"
          }`
        );
    });

    doc.moveDown();

    /* ---------------- FLIGHTS ---------------- */
    doc.fontSize(14).text("Flight Details", { underline: true });

    air.tripInfos.forEach((trip) => {
      trip.sI.forEach((seg) => {
        doc
          .fontSize(11)
          .text(
            `${seg.fD.aI.name} (${seg.fD.aI.code}-${seg.fD.fN})`
          )
          .text(
            `${seg.da.city} (${seg.da.code}) → ${seg.aa.city} (${seg.aa.code})`
          )
          .text(
            `Departure: ${new Date(seg.dt).toLocaleString()}`
          )
          .text(
            `Arrival: ${new Date(seg.at).toLocaleString()}`
          )
          .text(`Duration: ${seg.duration} mins`)
          .moveDown(0.5);
      });
    });

    doc.moveDown();

    /* ---------------- PRICE ---------------- */
    doc.fontSize(14).text("Fare Summary", { underline: true });

    doc
      .fontSize(11)
      .text(`Base Fare: ₹${air.totalPriceInfo.totalFareDetail.fC.BF}`)
      .text(`Taxes & Fees: ₹${air.totalPriceInfo.totalFareDetail.fC.TAF}`)
      .text(`Total Fare: ₹${air.totalPriceInfo.totalFareDetail.fC.TF}`);

    doc.moveDown(2);

    /* ---------------- FOOTER ---------------- */
    doc
      .fontSize(9)
      .fillColor("gray")
      .text(
        "This is a computer generated ticket. Please carry a valid photo ID at the airport.",
        { align: "center" }
      );

    doc.end();
  } catch (err) {
    console.error("❌ Ticket PDF error:", err);
    res.status(500).json({ message: "Failed to generate ticket" });
  }
};
