const Staff = require("../models/staff.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { notifyUser } = require("../utils/notify");

// Register Superadmin (only one allowed)
const registerSuperAdmin = async (req, res) => {
  try {
    const { first_name, last_name, username, email, password } = req.body;

    const existing = await Staff.findOne({ role: "superadmin" });
    if (existing) return res.status(400).json({ message: "Superadmin already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const superadmin = await Staff.create({
      first_name,
      last_name,
      username,
      email,
      password: hashedPassword,
      role: "superadmin",
      permissions: ["all"],
      is_active: true,
    });

   const token = jwt.sign(
  { staffId: superadmin._id, role: superadmin.role }, // ✅ use staffId
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);


    res.status(201).json({ message: "Superadmin registered successfully", superadmin, token });
  } catch (err) {
    console.error("Register Superadmin Error:", err);
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
};

// Staff Login
const staffLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const staff = await Staff.findOne({ email });
    if (!staff)
      return res.status(404).json({ message: "Staff not found" });

    if (!staff.is_active)
      return res.status(403).json({ message: "Account inactive" });

    const isMatch = await bcrypt.compare(password, staff.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { staffId: staff._id, role: staff.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 🔔 In-app notification (before response)
    notifyUser({
      staffId: staff._id,
      title: "Login Successful",
      message: "Your staff account was logged in successfully.",
      type: "SYSTEM",
      meta: {
        ip: req.ip,
        userAgent: req.headers["user-agent"]
      }
    }).catch(err => {
      console.error("Login notification failed:", err.message);
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      staff: {
        _id: staff._id,
        first_name: staff.first_name,
        last_name: staff.last_name,
        email: staff.email,
        role: staff.role,
      }
    });

  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({
      message: "Login failed",
      error: err.message
    });
  }
};


// Logout
const logoutStaff = async (req, res) => {
  res.status(200).json({ message: "Logout successful (token invalidated on client side)" });
};

// Create or Update Staff (Superadmin)
const createOrUpdateStaff = async (req, res) => {
  try {
    const { staffId, first_name, last_name, username, email, password, role = "admin", is_active = true } = req.body;

    if (staffId) {
      const staff = await Staff.findById(staffId);
      if (!staff) return res.status(404).json({ message: "Staff not found" });

      staff.first_name = first_name || staff.first_name;
      staff.last_name = last_name || staff.last_name;
      staff.username = username || staff.username;
      staff.email = email || staff.email;
      staff.role = role || staff.role;
      staff.is_active = is_active;
      if (password) staff.password = await bcrypt.hash(password, 10);
      staff.updated_at = new Date();

      await staff.save();
      return res.status(200).json({ message: "Staff updated successfully", staff });
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const staff = await Staff.create({
        first_name,
        last_name,
        username,
        email,
        password: hashedPassword, 
        role,
        is_active,
        created_by: req.staff._id,
        created_by_name: `${req.staff.first_name} ${req.staff.last_name}`,
      });
      await notifyUser({
  staffId: staff._id,
  title: "Staff Account Updated",
  message: "Your staff account details were updated.",
  type: "staff",
});


      res.status(201).json({ message: "Staff created successfully", staff });
    }
  } catch (err) {
    console.error("Create/Update Error:", err);
    res.status(500).json({ message: "Operation failed", error: err.message });
  }
};

// Update Own Profile
const updateOwnProfile = async (req, res) => {
  try {
    const staff = await Staff.findById(req.staff._id);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    const { first_name, last_name, username } = req.body;
    staff.first_name = first_name || staff.first_name;
    staff.last_name = last_name || staff.last_name;
    staff.username = username || staff.username;
    staff.updated_at = new Date();

    await staff.save();
    await notifyUser({
  staffId: staff._id,
  title: "New Staff Account Created",
  message: "A new staff account was created for you.",
  type: "staff"
});

    res.status(200).json({ message: "Profile updated successfully", staff });
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ message: "Profile update failed", error: err.message });
  }
};

// Toggle Staff Status (Superadmin)
const toggleStaffStatus = async (req, res) => {
  try {
    const { staffId, is_active } = req.body;
    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    staff.is_active = is_active;
    staff.updated_at = new Date();
    await staff.save();

    res.status(200).json({ message: `Staff ${is_active ? "activated" : "suspended"} successfully`, staff });
  } catch (err) {
    console.error("Toggle Status Error:", err);
    res.status(500).json({ message: "Status update failed", error: err.message });
  }
};

// Delete Staff (Superadmin)
const deleteStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    console.log("🔹 deleteStaff controller hit");
    console.log("staffId param:", staffId);

    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      console.log("Invalid ObjectId");
      return res.status(400).json({ message: "Invalid staff ID" });
    }

    const staff = await Staff.findById(staffId);
    console.log("Staff found in DB:", staff);

    if (!staff) return res.status(404).json({ message: "Staff not found" });

    await staff.deleteOne();
    console.log("Staff deleted successfully:", staffId);

    res.status(200).json({ message: `Staff ${staff.first_name} ${staff.last_name} deleted successfully` });
  } catch (err) {
    console.error("Delete Staff Error:", err);
    res.status(500).json({ message: "Deletion failed", error: err.message });
  }
};


// Get All Staff (Superadmin)
const getAllStaff = async (req, res) => {
  try {
    const staffList = await Staff.find().select("-password");
    res.status(200).json({ staff: staffList });
  } catch (err) {
    console.error("Get Staff Error:", err);
    res.status(500).json({ message: "Failed to fetch staff", error: err.message });
  }
};

// View Own Profile
const viewOwnProfile = async (req, res) => {
  try {
    const staff = await Staff.findById(req.staff._id).select("-password");
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    res.status(200).json({ message: "Profile fetched successfully", staff });
  } catch (err) {
    console.error("View Profile Error:", err);
    res.status(500).json({ message: "Failed to fetch profile", error: err.message });
  }
};

module.exports = {
  registerSuperAdmin,
  staffLogin,
  logoutStaff,
  createOrUpdateStaff,
  updateOwnProfile,
  toggleStaffStatus,
  deleteStaff,
  getAllStaff,
  viewOwnProfile,
};
