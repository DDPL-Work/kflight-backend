  // utils/notification.js

  const postmark = require("postmark");
  const axios = require("axios");

  // ==============================
  // 📧 Postmark Client Setup
  // ==============================
  const client = new postmark.ServerClient(process.env.POSTMARK_API_TOKEN);

  // ==============================
  // ✅ Send Email (Supports Postmark Template or Raw HTML)
  // ==============================
  const sendEmail = async (to, subjectOrTemplate, htmlOrModel = null) => {
    try {
      if (!to) throw new Error("No recipient email provided");

      // If object with template info is passed
      if (typeof to === "object") {
        const obj = to;
        to = obj.to;

        // Template mode
        if (obj.templateId && obj.model) {
          return await client.sendEmailWithTemplate({
            From: process.env.FROM_EMAIL,
            To: to,
            TemplateId: obj.templateId,
            TemplateModel: obj.model,
          });
        }

        // Raw HTML mode
        subjectOrTemplate = obj.subject;
        htmlOrModel = obj.html;
      }

      // Raw HTML email fallback
      const response = await client.sendEmail({
        From: process.env.FROM_EMAIL,
        To: to,
        Subject: subjectOrTemplate,
        HtmlBody: htmlOrModel,
      });

      console.log(`📧 Email sent successfully to ${to}`, response);
    } catch (error) {
      console.error("❌ Email Error:", error.message);
    }
  };

  // ==============================
  // 📱 Send SMS (2Factor) - Production Ready
  // ==============================
  const sendSMS = async (to) => {
    try {
      if (!process.env.TWO_FACTOR_API_KEY) {
        throw new Error("2Factor API Key missing");
      }

      if (!to.startsWith("91")) {
        to = "91" + to.replace(/\D/g, "");
      }

      const url = `https://2factor.in/API/V1/${process.env.TWO_FACTOR_API_KEY}/SMS/${to}/AUTOGEN`;

      console.log("📤 Sending OTP via 2Factor AUTOGEN:", url);

      const response = await axios.get(url, { timeout: 10000 });

      if (response.data?.Status !== "Success") {
        throw new Error(response.data?.Details || "OTP SMS Failed");
      }

      return response.data;
    } catch (error) {
      console.error("❌ 2Factor OTP Error:", error.response?.data || error.message);
      throw error;
    }
  };


  // ==============================
  // ✅ Export Functions
  // ==============================
  module.exports = { sendEmail, sendSMS };
