const express = require("express");
const router = express.Router();
const {
  staffLogin,
  registerSuperAdmin,
  logoutStaff,
  createOrUpdateStaff,
  toggleStaffStatus,
  getAllStaff,
  updateOwnProfile,
  deleteStaff,
  viewOwnProfile
} = require("../controllers/staff_auth.controller");
const { staffAuth, superAdminOnly } = require("../middlewares/staffAuth.middleware");

// Public routes
router.post("/register-superadmin", registerSuperAdmin);
router.post("/login", staffLogin);

// Authenticated routes
router.put("/update-profile", staffAuth(), updateOwnProfile);
router.post("/logout", staffAuth(), logoutStaff);
router.get("/profile", staffAuth(), viewOwnProfile);

// Superadmin routes
router.post("/create-update", staffAuth(), superAdminOnly, createOrUpdateStaff);
router.post("/toggle-status", staffAuth(), superAdminOnly, toggleStaffStatus);
router.get("/all", staffAuth(), superAdminOnly, getAllStaff);
router.delete("/:staffId", staffAuth(), superAdminOnly, deleteStaff); // ✅ Correct param

module.exports = router;
