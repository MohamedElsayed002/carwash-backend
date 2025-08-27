const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const auth = require('../../middleware/auth');



router.get('/', (req, res) => {
    res.send('Payment routes')
})
// Basic payment routes (commented out until controller functions are implemented)
// router.get('/checkout', paymentController.testPayment)
// router.get('/status', paymentController.status)
// router.post('/webhook', paymentController.webhook)

// Test endpoint for debugging (must come before /:id route)
// router.get('/test-result', paymentController.testPaymentResult);

// HyperPay payment result handling (must come before /:id route)
// router.get('/result', paymentController.handlePaymentResult); // No auth required for HyperPay callback

// POST /payments now requires { package, car, amount, method } in body
// Returns: { payment, userPackage }
// router.post('/', auth, paymentController.createPayment);
// router.get('/', auth, paymentController.getPayments);
// router.post('/hyperpay-checkout', auth, paymentController.createHyperpayCheckout);
// router.post('/create-from-hyperpay', auth, paymentController.createPaymentFromHyperPay);
// router.post('/create-tip-from-hyperpay', auth, paymentController.createTipPaymentFromHyperPay);
// router.get('/:id', auth, paymentController.getPayment);
// router.put('/:id', auth, paymentController.updatePayment);
// router.delete('/:id', auth, paymentController.deletePayment);

// ========================================
// MISSING PAYMENT ROUTES
// ========================================

// Get payments for specific user
// router.get('/user/:userId', auth, paymentController.getPaymentsByUserId);

// Verify payment
// router.post('/:id/verify', auth, paymentController.verifyPayment);

// Refund payment
// router.post('/:id/refund', auth, paymentController.refundPayment);

module.exports = router; 