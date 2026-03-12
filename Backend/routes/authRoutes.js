const express = require('express');
const router = express.Router();
const { signup, login, verifyEmail, forgotPassword, verifyResetCode, resetPassword } = require('../controllers/authController');

// POST /api/auth/signup
router.post('/signup', signup);

// POST /api/auth/login
router.post('/login', login);

// Email Verification
// POST /api/auth/verify-email
router.post('/verify-email', verifyEmail);

// Forgot Password Flow
// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/verify-reset-code
router.post('/verify-reset-code', verifyResetCode);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

module.exports = router;
