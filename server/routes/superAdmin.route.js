const express = require('express');
const {
  createStaff,
  getStaffByRole,
  getStaffById,
  deleteStaff,
  deleteUser,
  getAllUsers,
  staffLogin
} = require('../controllers/SuperAdmin.controller.js');

const router = express.Router();


router.post('/create', createStaff);
router.get('/all', getStaffByRole);
router.get('/:id', getStaffById);
router.get('/users', getAllUsers);
router.delete('/:id', deleteStaff);
router.delete('/user/:id', deleteUser);
router.post('/login', staffLogin);

module.exports = router;
