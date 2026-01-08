// server/models/Staff.model.js

const mongoose = require("mongoose");
const { Schema } = mongoose;

const staffSchema = new Schema({
  first_name: { type: String, required: true, trim: true },
  last_name: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["superadmin", "admin", "seo"],
    default: "admin",
  },
  permissions: { type: [String], default: [] },
  is_active: { type: Boolean, default: true },
  created_by: { type: Schema.Types.ObjectId, ref: "Staff" },
  created_by_name: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date },
});

// ✅ SAFE EXPORT (NO OverwriteModelError)
module.exports =
  mongoose.models.Staff ||
  mongoose.model("Staff", staffSchema, "staffs");
