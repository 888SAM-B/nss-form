const express = require('express');
const router = express.Router();
const { adminLogin } = require('../controllers/authController');

// @route   POST /api/auth/admin-login
router.post('/admin-login', adminLogin);

module.exports = router;
