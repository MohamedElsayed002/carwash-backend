const express = require('express');
const router = express.Router();
const hyperpayCopyandpayController = require('../modules/hyperpay/hyperpay-copyandpay.controller');
const auth = require('../middleware/auth');

router.post('/prepare-checkout-copyandpay', auth, hyperpayCopyandpayController.prepareCheckout);
router.get('/create-checkout-form/:checkoutId', hyperpayCopyandpayController.createCheckoutForm);
router.get('/payment-result', hyperpayCopyandpayController.paymentResult)
router.get('/check-status', auth, hyperpayCopyandpayController.checkStatus);
router.get('/test-apple-pay-config', hyperpayCopyandpayController.testApplePayConfig);



// فحص صحة الخدمة (Health Check)
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'HyperPay service is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// مسار للاختبار (يمكن حذفه في الإنتاج)
router.get('/test', (req, res) => {
    res.json({
        message: 'HyperPay test endpoint',
        config: {
            baseUrl: process.env.HYPERPAY_BASE_URL || 'https://test.oppwa.com',
            entityId: process.env.HYPERPAY_ENTITY_ID ? '***configured***' : 'not configured',
            accessToken: process.env.HYPERPAY_ACCESS_TOKEN ? '***configured***' : 'not configured',
            isTest: process.env.NODE_ENV !== 'production'
        }
    });
});


module.exports = router;
