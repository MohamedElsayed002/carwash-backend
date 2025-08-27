const express = require('express');
const router = express.Router();
const hyperpayController = require('../modules/hyperpay/hyperpay.controller');

// ----------------------------------------------------------------
// --- المسارات الأساسية لعملية الدفع (Production Flow) ---
// ----------------------------------------------------------------

// الخطوة 1: الواجهة الأمامية تطلب من الخادم تجهيز الدفع.
// الخادم يتصل بهايبر باي ويعيد checkoutId.
router.post('/prepare-checkout', hyperpayController.prepareCheckout);

// مسار بديل للتوافق مع الفرونت إند
router.post('/prepare', hyperpayController.prepareCheckout);

// الخطوة 2: (تتم في الواجهة الأمامية فقط - لا يوجد مسار لها هنا)
// المتصفح يستخدم checkoutId لعرض نموذج الدفع.

// الخطوة 3: المستخدم يعود من بوابة الدفع إلى هذا الرابط.
// هذا المسار يستقبل المستخدم ويعرض له صفحة مؤقتة، بينما يبدأ التحقق في الخلفية.
router.get('/payment-callback', hyperpayController.handlePaymentCallback);

// ----------------------------------------------------------------
// --- مسارات للمراقبة والخدمات المساعدة ---
// ----------------------------------------------------------------

// مسار Webhook (موصى به بشدة): هايبر باي ترسل إشعارًا إلى هذا الرابط لتأكيد حالة الدفع.
// هذا هو الطريق الأكثر أمانًا وموثوقية لتحديث حالة الطلب.
router.post('/webhook-listener', hyperpayController.verifyPaymentFromWebhook);

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

// مسار اختبار الاتصال مع HyperPay
router.get('/test-connection', hyperpayController.testConnection);

// مسار للتحقق من حالة الدفع
router.get('/status', hyperpayController.checkPaymentStatus);
router.get('/status/:checkoutId', hyperpayController.checkPaymentStatus);

module.exports = router;
