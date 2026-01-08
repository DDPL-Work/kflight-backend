require("dotenv").config();
const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🎆Database connected successfully");
  } catch (err) {
    console.error("Error in DB connection:", err);
  }
}

connectDB();

module.exports = mongoose;