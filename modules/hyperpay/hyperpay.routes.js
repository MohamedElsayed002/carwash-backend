const express = require('express');
const router = express.Router();
const hyperpayController = require('./hyperpay.controller');

// ✅ إنشاء checkout session
router.post('/create-checkout', hyperpayController.createCheckout);

// ✅ التحقق من حالة الدفع
router.get('/payment-status/:checkoutId', hyperpayController.getPaymentStatus);

// ✅ معالجة نتيجة الدفع (Webhook)
router.post('/payment-result', hyperpayController.handlePaymentResult);

// ✅ اختبار الاتصال
router.get('/test-connection', hyperpayController.testConnection);

module.exports = router;
