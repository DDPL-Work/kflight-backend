const crypto = require("crypto");

const order_id = "order_Rbz0Xn3yCawiUo"; // from /order API
const payment_id = "pay_test_123456"; // mock payment id
const key_secret = "N3hp4Pr3imA502zymNNyIYGI"; // from .env (same used in backend)

const sign = order_id + "|" + payment_id;
const expectedSign = crypto
  .createHmac("sha256", key_secret)
  .update(sign)
  .digest("hex");

console.log("Generated Signature:", expectedSign);
