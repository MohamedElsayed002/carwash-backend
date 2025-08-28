const axios = require('axios');
const crypto = require('crypto');
const qs = require('qs');

// --- بيانات الاعتماد الحقيقية من HyperPay ---
const HYPERPAY_CONFIG = {
    baseUrl: process.env.HYPERPAY_BASE_URL || "https://eu-test.oppwa.com",
    // Entity ID يدعم SAR و VISA/MADA
    entityId: process.env.HYPERPAY_ENTITY_ID || "8ac7a4c897f92ba00198037be75705a7",
    accessToken: `Bearer ${process.env.HYPERPAY_ACCESS_TOKEN || "OGFjN2E0Yzg5N2Y5MmJhMDAxOTgwMzdiOTFlYzA1YTN8NWEjekt5d00yUFJiYWVnakthNDU="}`,
    userId: process.env.HYPERPAY_USER_ID || "joudmkhateb@gmail.com",
    password: process.env.HYPERPAY_PASSWORD || "Jmk6060217PP"
};

/**
 * الخطوة 1: تجهيز الدفع
 * يتصل بهايبر باي للحصول على checkoutId
 */
exports.prepareCheckout = async (req, res) => {
    try {
        // في تطبيق حقيقي، ستحصل على هذه البيانات من الطلب (req.body)
        const {
            amount = "92.00",
            currency = "SAR",
            paymentBrand = "MADA",
            customerEmail = "customer@example.com",
            customerName = "أحمد محمد",
            billingStreet = "شارع الملك فهد",
            billingCity = "الرياض",
            billingState = "المنطقة الوسطى",
            billingCountry = "SA"
        } = req.body;

        // التحقق من صحة البيانات
        if (!amount || !currency) {
            return res.status(400).json({
                success: false,
                error: "المبلغ والعملة مطلوبان"
            });
        }

        // تحديد entityId بناءً على نوع البطاقة (إذا كان لديك أكثر من entityId)
        const entityId = HYPERPAY_CONFIG.entityId;

        const paymentData = {
            'entityId': entityId,
            'amount': amount.toString(), // مهم أن يكون نصًا وينتهي بـ .00 في الاختبار
            'currency': currency,
            'paymentType': 'DB', // DB = Debit (مدى أو بطاقة ائتمان)
            'customer.email': customerEmail,
            'customer.givenName': customerName.split(' ')[0] || 'أحمد',
            'customer.surname': customerName.split(' ').slice(1).join(' ') || 'محمد',
            'billing.street1': billingStreet,
            'billing.city': billingCity,
            'billing.state': billingState,
            'billing.country': billingCountry,
            // 'testMode': 'EXTERNAL',
            "customParameters[3DS2_enrolled]": true,
            "customParameters[3DS2_flow]": "challenge"
        };

        console.log("🚀 Preparing checkout with data:", paymentData);

        const response = await axios.post(`${HYPERPAY_CONFIG.baseUrl}/v1/checkouts`, qs.stringify(paymentData), {
            headers: {
                'Authorization': HYPERPAY_CONFIG.accessToken,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        console.log("✅ Checkout prepared successfully:", response.data);

        res.status(200).json({
            success: true,
            data: response.data,
            checkoutId: response.data.id,
            message: "تم تجهيز الدفع بنجاح"
        });

    } catch (error) {
        // --- تحسين تسجيل الأخطاء ---
        console.error("--- CHECKOUT PREPARATION FAILED ---");
        console.error("Request Data:", JSON.stringify(paymentData, null, 2));
        console.error("Config:", {
            baseUrl: HYPERPAY_CONFIG.baseUrl,
            entityId: HYPERPAY_CONFIG.entityId,
            hasAccessToken: !!HYPERPAY_CONFIG.accessToken
        });

        if (error.response) {
            // الخطأ جاء من خادم هايبر باي
            console.error("Status Code:", error.response.status);
            console.error("Response Data:", JSON.stringify(error.response.data, null, 2));
            console.error("Response Headers:", error.response.headers);
        } else if (error.request) {
            // تم إرسال الطلب ولكن لم يتم استلام رد
            console.error("No response received from HyperPay:", error.request);
        } else {
            // خطأ حدث أثناء إعداد الطلب
            console.error("Error setting up the request:", error.message);
        }

        const errorData = error.response ? error.response.data : error.message;
        console.error("❌ Error preparing checkout:", errorData);

        res.status(500).json({
            success: false,
            error: "فشل في تجهيز الدفع",
            details: errorData
        });
    }
};

/**
 * الخطوة 3: معالجة عودة المستخدم
 * يعرض رسالة بسيطة ويبدأ التحقق من الخادم.
 */
exports.handlePaymentCallback = async (req, res) => {
    const { resourcePath, id: checkoutId } = req.query;

    console.log("🔄 Payment callback received:", { checkoutId, resourcePath });

    // تحقق مبدئي من وجود البيانات
    if (!resourcePath || !checkoutId) {
        console.error("❌ Callback received with missing data");
        return res.status(400).json({
            success: false,
            error: "بيانات الدفع غير مكتملة"
        });
    }

    try {
        // التحقق من حالة الدفع النهائية من الخادم (Server-to-Server)
        const paymentStatus = await checkPaymentStatus(resourcePath);

        console.log("📊 Payment status received:", paymentStatus);

        // التحقق من رمز النتيجة باستخدام التعبير النمطي الموصى به
        const isSuccess = /^(000\.000\.|000\.100\.1|000\.[23]00\.)/.test(paymentStatus.result.code);

        if (isSuccess) {
            // --- الدفع ناجح ---
            console.log(`✅ SUCCESS: Payment for checkoutId ${checkoutId} is confirmed. Code: ${paymentStatus.result.code}`);

            // TODO: تحديث قاعدة البيانات - قم بتغيير حالة الطلب إلى "مدفوع"
            // await database.orders.update({ id: orderId }, { status: 'PAID' });

            // TODO: إرسال إيميل تأكيد للعميل
            // await emailService.sendConfirmation(customerEmail);

            res.json({
                success: true,
                status: 'success',
                message: 'تم الدفع بنجاح',
                data: {
                    checkoutId,
                    resultCode: paymentStatus.result.code,
                    description: paymentStatus.result.description,
                    timestamp: new Date().toISOString()
                }
            });

        } else {
            // --- الدفع فاشل ---
            const failureReason = paymentStatus.result.description;
            console.log(`❌ FAILURE: Payment for checkoutId ${checkoutId} failed. Reason: ${failureReason}`);

            // TODO: تحديث قاعدة البيانات - قم بتغيير حالة الطلب إلى "فشل الدفع"
            // await database.orders.update({ id: orderId }, { status: 'PAYMENT_FAILED' });

            res.json({
                success: false,
                status: 'failed',
                message: 'فشل في الدفع',
                error: failureReason,
                data: {
                    checkoutId,
                    resultCode: paymentStatus.result.code,
                    description: paymentStatus.result.description,
                    timestamp: new Date().toISOString()
                }
            });
        }

    } catch (error) {
        console.error("❌ Error during payment verification:", error.message);

        res.status(500).json({
            success: false,
            error: "حدث خطأ أثناء التحقق من حالة الدفع",
            details: error.message
        });
    }
};

/**
 * وظيفة مساعدة للتحقق من حالة الدفع بشكل آمن
 * @param {string} resourcePath - المسار الذي تم استلامه من هايبر باي
 */
async function checkPaymentStatus(resourcePath) {
    const url = `${HYPERPAY_CONFIG.baseUrl}${resourcePath}?entityId=${HYPERPAY_CONFIG.entityId}`;

    console.log("🔍 Checking payment status at URL:", url);

    const response = await axios.get(url, {
        headers: {
            'Authorization': HYPERPAY_CONFIG.accessToken
        }
    });

    return response.data;
}

/**
 * (اختياري ولكنه موصى به) معالجة إشعارات Webhook
 * هايبر باي تتصل بهذا المسار مباشرة لتأكيد الدفع
 */
exports.verifyPaymentFromWebhook = async (req, res) => {
    try {
        console.log("🔔 Webhook received:", req.body);

        // استخراج البيانات من Webhook
        const { resourcePath, id: checkoutId } = req.body.payload || {};

        if (!resourcePath || !checkoutId) {
            console.error("❌ Webhook missing required data");
            return res.status(400).json({ error: "Missing required data" });
        }

        // التحقق من حالة الدفع
        const paymentStatus = await checkPaymentStatus(resourcePath);
        const isSuccess = /^(000\.000\.|000\.100\.1|000\.[23]00\.)/.test(paymentStatus.result.code);

        if (isSuccess) {
            console.log(`✅ Webhook: Payment ${checkoutId} confirmed successful`);
            // TODO: تحديث قاعدة البيانات
        } else {
            console.log(`❌ Webhook: Payment ${checkoutId} failed`);
            // TODO: تحديث قاعدة البيانات
        }

        // أرسل استجابة 200 OK لتأكيد استلام الإشعار
        res.sendStatus(200);

    } catch (error) {
        console.error("❌ Error processing webhook:", error);
        res.status(500).json({ error: "Webhook processing failed" });
    }
};

/**
 * فك تشفير Webhook (إذا كان مشفراً)
 */
function decryptWebhook(encryptedData, secret, iv, authTag) {
    try {
        const key = Buffer.from(secret, 'hex');
        const ivBuffer = Buffer.from(iv, 'hex');
        const authTagBuffer = Buffer.from(authTag, 'hex');
        const cipherText = Buffer.from(encryptedData, 'hex');

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, ivBuffer);
        decipher.setAuthTag(authTagBuffer);

        const result = decipher.update(cipherText) + decipher.final();
        return JSON.parse(result);

    } catch (error) {
        console.error("❌ Error decrypting webhook:", error);
        throw error;
    }
}

/**
 * التحقق من حالة الدفع
 */
exports.checkPaymentStatus = async (req, res) => {
    try {
        const { checkoutId } = req.params;
        const { resourcePath } = req.query;

        console.log("🔍 Checking payment status:", { checkoutId, resourcePath });
        console.log("🔧 Config:", {
            baseUrl: HYPERPAY_CONFIG.baseUrl,
            entityId: HYPERPAY_CONFIG.entityId,
            hasAccessToken: !!HYPERPAY_CONFIG.accessToken
        });

        if (!resourcePath && !checkoutId) {
            console.log("❌ Missing both resourcePath and checkoutId");
            return res.status(400).json({
                success: false,
                error: "Missing resourcePath or checkoutId"
            });
        }

        // استخدام resourcePath إذا كان متوفراً، وإلا استخدام checkoutId
        const pathToCheck = resourcePath || `/v1/checkouts/${checkoutId}/payment`;

        const statusUrl = `${HYPERPAY_CONFIG.baseUrl}${pathToCheck}?entityId=${HYPERPAY_CONFIG.entityId}`;

        console.log("🔗 Checking URL:", statusUrl);

        const response = await axios.get(statusUrl, {
            headers: {
                'Authorization': HYPERPAY_CONFIG.accessToken
            }
        });

        const paymentStatus = response.data;
        console.log("📊 Payment status response:", paymentStatus);

        // التحقق من وجود result.code
        if (!paymentStatus.result || !paymentStatus.result.code) {
            console.log("⚠️ No result code found in response");
            return res.json({
                success: true,
                status: 'unknown',
                data: paymentStatus,
                message: 'Payment status unknown'
            });
        }

        // التحقق من رمز النتيجة
        const isSuccess = /^(000\.000\.|000\.100\.1|000\.[23]00\.)/.test(paymentStatus.result.code);

        console.log(`✅ Payment status determined: ${isSuccess ? 'success' : 'failed'}`);

        res.json({
            success: true,
            status: isSuccess ? 'success' : 'failed',
            data: paymentStatus,
            message: isSuccess ? 'Payment successful' : 'Payment failed'
        });

    } catch (error) {
        console.error("❌ Error checking payment status:");
        console.error("Error details:", error.response?.data || error.message);
        console.error("Error status:", error.response?.status);
        console.error("Error config:", error.config);

        res.status(500).json({
            success: false,
            error: "Failed to check payment status",
            details: error.response?.data || error.message
        });
    }
};

/**
 * اختبار الاتصال مع HyperPay
 */
exports.testConnection = async (req, res) => {
    try {
        console.log("🧪 Testing HyperPay connection...");
        console.log("Config:", {
            baseUrl: HYPERPAY_CONFIG.baseUrl,
            entityId: HYPERPAY_CONFIG.entityId,
            hasAccessToken: !!HYPERPAY_CONFIG.accessToken
        });

        const testData = {
            'entityId': HYPERPAY_CONFIG.entityId,
            'amount': '1.00',
            'currency': 'SAR',
            'paymentType': 'DB'
        };

        console.log("Test Data:", testData);

        const response = await axios.post(`${HYPERPAY_CONFIG.baseUrl}/v1/checkouts`, qs.stringify(testData), {
            headers: {
                'Authorization': HYPERPAY_CONFIG.accessToken,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        console.log("✅ Connection test successful:", response.data);

        res.json({
            success: true,
            message: "HyperPay connection test successful",
            data: response.data,
            config: {
                baseUrl: HYPERPAY_CONFIG.baseUrl,
                entityId: HYPERPAY_CONFIG.entityId,
                hasAccessToken: !!HYPERPAY_CONFIG.accessToken
            }
        });

    } catch (error) {
        console.error("❌ Connection test failed:", error.response?.data || error.message);

        res.status(500).json({
            success: false,
            error: "HyperPay connection test failed",
            details: error.response?.data || error.message,
            config: {
                baseUrl: HYPERPAY_CONFIG.baseUrl,
                entityId: HYPERPAY_CONFIG.entityId,
                hasAccessToken: !!HYPERPAY_CONFIG.accessToken
            }
        });
    }
};

/**
 * إنشاء نموذج الدفع (Copy and Pay)
 * يعرض نموذج الدفع للمستخدم
 */
exports.createCheckoutForm = async (req, res) => {
    try {
        const { checkoutId } = req.params;

        console.log("🔗 Creating checkout form for:", checkoutId);

        if (!checkoutId) {
            return res.status(400).json({
                success: false,
                error: "معرف الدفع مطلوب"
            });
        }

        // إنشاء HTML page مع نموذج الدفع
        const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>نموذج الدفع - HyperPay</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            padding: 40px;
            max-width: 500px;
            width: 100%;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #059669;
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        .header p {
            color: #6b7280;
            margin: 0;
        }
        .payment-form {
            margin-top: 30px;
        }
        .wpwl-form {
            max-width: 100% !important;
        }
        .wpwl-apple-pay-button {
            font-size: 16px !important;
            display: block !important;
            width: 100% !important;
            -webkit-appearance: -apple-pay-button;
            -apple-pay-button-type: buy;
        }
        .wpwl-apple-pay-button {
            -webkit-appearance: -apple-pay-button !important;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #6b7280;
            font-size: 14px;
        }
        .security-badge {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-top: 20px;
            padding: 10px;
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 10px;
            color: #166534;
            font-size: 14px;
        }
    </style>
    <script type="text/javascript" src="https://test.oppwa.com/v1/paymentWidgets.js?checkoutId=${checkoutId}"></script>
    <script type="text/javascript" src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"></script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💳 نموذج الدفع الآمن</h1>
            <p>أدخل بيانات بطاقتك الائتمانية لإتمام عملية الدفع</p>
        </div>
        
        <div class="payment-form">
            <form action="${process.env.BASE_URL || 'http://localhost:5000'}/api/hyperpay/payment-callback" class="paymentWidgets" data-brands="VISA MASTER MADA">
                <div id="card-container"></div>
                <button type="submit" class="wpwl-button wpwl-button-pay" style="background: #059669; border: none; padding: 15px; border-radius: 10px; color: white; font-size: 16px; font-weight: bold; width: 100%; margin-top: 20px;">
                    💳 إتمام الدفع
                </button>
            </form>
        </div>
        
        <div class="security-badge">
            🔒 الدفع آمن ومشفر - HyperPay
        </div>
        
        <div class="footer">
            <p>جميع البيانات محمية ومشفرة</p>
        </div>
    </div>

    <script>
        var wpwlOptions = {
            applePay: {
                displayName: "Car Wash App",
                total: { label: "CAR WASH APP" },
                supportedNetworks: ["mada", "masterCard", "visa"],
                merchantCapabilities: ["supports3DS", "supportsCredit", "supportsDebit"],
                countryCode: "SA",
                supportedCountries: ["SA"],
                version: 3
            },
            locale: "ar",
            brandDetection: true,
            onReady: function() {
                console.log("Payment form ready");
            },
            onError: function(error) {
                console.error("Payment form error:", error);
                alert("حدث خطأ في نموذج الدفع: " + error.message);
            }
        };

        // Handle form submission
        document.querySelector('.paymentWidgets').addEventListener('submit', function(e) {
            // Let the form submit normally to the callback URL
            console.log("Form submitted, redirecting to callback...");
        });
    </script>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html');
        res.send(htmlContent);

    } catch (error) {
        console.error("❌ Error creating checkout form:", error);
        res.status(500).json({
            success: false,
            error: "فشل في إنشاء نموذج الدفع",
            details: error.message
        });
    }
};

/**
 * معالجة callback الدفع
 */
exports.paymentCallback = async (req, res) => {
    try {
        const { resourcePath, id: checkoutId } = req.query;

        console.log("🔄 Payment callback received:", { checkoutId, resourcePath });

        if (!resourcePath || !checkoutId) {
            return res.status(400).json({
                success: false,
                error: "بيانات الدفع غير مكتملة"
            });
        }

        // التحقق من حالة الدفع
        const paymentStatus = await checkPaymentStatus(resourcePath);
        const isSuccess = /^(000\.000\.|000\.100\.1|000\.[23]00\.)/.test(paymentStatus.result.code);

        if (isSuccess) {
            // Redirect to payment form page with success status
            res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-form/${checkoutId}?status=success&checkoutId=${checkoutId}`);
        } else {
            // Redirect to payment form page with failed status
            res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-form/${checkoutId}?status=failed&checkoutId=${checkoutId}`);
        }

    } catch (error) {
        console.error("❌ Error in payment callback:", error);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-result?status=error`);
    }
};
