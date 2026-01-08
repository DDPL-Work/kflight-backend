// testEmail.js
require('dotenv').config();  // <-- Load .env variables

const { sendEmail } = require("./utils/notification");

console.log("POSTMARK_API_TOKEN:", process.env.POSTMARK_API_TOKEN);
console.log("FROM_EMAIL:", process.env.FROM_EMAIL);

(async () => {
  try {
    await sendEmail({
      to: "ashish2kathait@gmail.com",
      templateId: 42575287,      
      model: {
        otp: "123456",
        purpose: "Login",
        expiryMinutes: 10,
      },
    });
    console.log("✅ Test email sent successfully");
  } catch (err) {
    console.error("❌ Test email failed:", err);
  }
})();
