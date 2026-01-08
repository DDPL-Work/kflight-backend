// utils/sendOTPTest.js
const axios = require("axios");

const sendOTPTest = async (to, otp) => {
  try {
    if (!to.startsWith("91")) to = "91" + to;

    const url = `https://2factor.in/API/V1/${process.env.TWO_FACTOR_API_KEY}/SMS/${to}/${otp}/OTP for KaroFlight login`;

    console.log("📤 SENDING OTP URL:", url);

    const response = await axios.get(url);

    console.log("✅ OTP RAW RESPONSE:", response.data);

    if (response.data.Status !== "Success") {
      throw new Error(response.data.Details || "OTP Failed");
    }

    console.log("✅ OTP SENT TO:", to);
  } catch (error) {
    if (error.response) {
      console.error("❌ OTP ERROR RESPONSE:", error.response.data);
    } else {
      console.error("❌ OTP ERROR:", error.message);
    }
  }
};

module.exports = { sendOTPTest };
