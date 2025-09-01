const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const auth = require('../../middleware/auth');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);
router.delete('/profile', auth, userController.deleteProfile);
router.get('/barcodes', auth, userController.getActiveUserPackages);
router.get('/referral-link', auth, userController.generateReferralLink);
router.post('/accept-referral', auth, userController.acceptReferral);
router.post('/reward-referral', auth, userController.rewardReferral);
router.post('/send-otp', auth, userController.sendOTP);
router.post('/verify-otp', auth, userController.verifyOTP);
router.get('/referral-status', auth, userController.getReferralStatus);
router.post('/phone-login-initiate', userController.phoneLoginInitiate);
router.post('/phone-login-verify', userController.phoneLoginVerify);
router.post('/phone-signup-initiate', userController.phoneSignupInitiate);
router.post('/phone-signup-verify', userController.phoneSignupVerify);

// ========================================
// MISSING AUTHENTICATION ROUTES
// ========================================

// Logout
router.post('/logout', auth, userController.logout);

// Password management
router.put('/change-password', auth, userController.changePassword);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

// ========================================
// PACKAGE MANAGEMENT ROUTES
// ========================================

// Add package to current user
router.post('/add-package', auth, userController.addPackageToCurrentUser);

// Remove package from current user
router.delete('/remove-package', auth, userController.removePackageFromCurrentUser);

// Get user's package with calculated price
router.get('/package-with-price', auth, userController.getUserPackageWithPrice);

// Get all available packages
router.get('/available-packages', auth, userController.getAvailablePackages);

// Generate QR code for user's package
router.get('/package-qr-code', auth, userController.generatePackageQRCode);

// Use one wash from package
router.post('/use-wash', userController.useWash);

// Scan QR code and use wash (for staff/admin)
router.post('/scan-qr-code', auth, userController.scanQRCode);

// Get detailed package status
router.get('/package-status', auth, userController.getPackageStatus);

// ========================================
// PAYMENT STATUS ROUTES
// ========================================

// Get user's payment status
router.get('/payment-status', auth, userController.getPaymentStatus);

// Update user's payment status
router.post('/update-payment-status', auth, userController.updatePaymentStatus);

// Handle payment success
router.post('/payment-success', auth, userController.handlePaymentSuccess);

// ========================================
// LOCATION MANAGEMENT ROUTES
// ========================================

// Set user's preferred wash location
router.post('/set-location', auth, userController.setLocation);

// Get user's preferred wash location
router.get('/location', auth, userController.getLocation);

// Remove user's preferred wash location
router.delete('/location', auth, userController.removeLocation);

// ========================================
// ADMIN USER MANAGEMENT ROUTES
// ========================================

// Get all users (Admin)
router.get('/', auth, userController.getAllUsers);

// Get user by ID (Admin)
router.get('/:id', auth, userController.getUserById);

// Create user (Admin)
router.post('/', auth, userController.createUser);

// Update user (Admin)
router.put('/:id', auth, userController.updateUser);

// Delete user (Admin)
router.delete('/:id', auth, userController.deleteUser);

// Add package to specific user (Admin)
router.post('/:id/add-package', auth, userController.addPackageToUser);

module.exports = router; 