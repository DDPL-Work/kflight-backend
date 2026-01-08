// routes/demo.js
const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/flightBooking.controller");

// Demo: Instant Book Flight
router.post("/instant-book-demo", async (req, res) => {
  try {
    // Use your sample payload
    const demoPayload = {
      snapshotId: "YOUR_SNAPSHOT_ID_HERE",  // must exist in DB
      travellers: [
        { title: "Mr", firstName: "Test", lastName: "AdultA", type: "ADULT" },
        { title: "Ms", firstName: "Test", lastName: "ChildA", type: "CHILD" },
        { title: "Master", firstName: "Test", lastName: "InfantA", type: "INFANT", dob: "2019-08-09" }
      ],
      deliveryInfo: {
        emails: ["prabhu@technogramsolutions.com"],
        contacts: ["9538500324"]
      },
      gstInfo: {
        gstNumber: "07AAGCT7826A1ZF",
        email: "prabhu@technogramsolutions.com",
        companyName: "TGS Pvt Ltd",
        mobile: "9538500324",
        address: "gurugram"
      }
    };

    const resp = await bookingController.instantBookFlight({ body: demoPayload }, { 
      status: (code) => ({ json: (data) => data }), 
      json: (data) => data 
    });

    res.json(resp);

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
