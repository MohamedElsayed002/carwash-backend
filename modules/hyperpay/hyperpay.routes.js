const express = require('express');
const router = express.Router();
const hyperpayController = require('./hyperpay.controller');


router.get('/',(req,res) => {
    res.send('HyperPay API is running');
})
// ✅ إنشاء checkout session
router.post('/create-checkout', hyperpayController.prepareCheckout);

// ✅ التحقق من حالة الدفع
router.get('/payment-status/:checkoutId', hyperpayController.getPaymentStatus);

// ✅ معالجة نتيجة الدفع (Webhook)
router.post('/payment-result', hyperpayController.handlePaymentResult);

// ✅ اختبار الاتصال
router.get('/test-connection', hyperpayController.testConnection);

module.exports = router;
