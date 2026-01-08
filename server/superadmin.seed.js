const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const Staff = require("./models/staff.model"); // adjust path

const seedSuperadmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const exists = await Staff.findOne({ email: "superadmin@test.com" });
    if (exists) {
      console.log("Superadmin already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("Super@123", 10);

    const superadmin = new Staff({
      first_name: "Super",
      last_name: "Admin",
      username: "superadmin",
      email: "superadmin@test.com",
      password: hashedPassword,
      role: "superadmin",
    });

    await superadmin.save();
    console.log("Superadmin created: superadmin@test.com / Super@123");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedSuperadmin();
