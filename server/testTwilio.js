require('dotenv').config();
const twilio = require('twilio');

// Load credentials from .env
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Replace this with your own verified number in Twilio
const testRecipient = '+91XXXXXXXXXX'; 

client.messages
  .create({
    body: '✅ Test message from KFlight Twilio integration!',
    from: process.env.TWILIO_PHONE_NUMBER,
    to: testRecipient,
  })
  .then(message => console.log('✅ Message sent successfully! SID:', message.sid))
  .catch(error => console.error('❌ Error sending message:', error.message));
