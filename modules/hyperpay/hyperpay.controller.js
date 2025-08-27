const axios = require('axios');
const crypto = require('crypto');

// --- بيانات الاعتماد الحقيقية من HyperPay ---
const HYPERPAY_CONFIG = {
    baseUrl: process.env.HYPERPAY_BASE_URL || "https://eu-test.oppwa.com",
    // Entity ID يدعم SAR و VISA/MADA
    entityId: process.env.HYPERPAY_ENTITY_ID || "8a8294174d0595bb014d05d829cb01cd",
    accessToken: `Bearer ${process.env.HYPERPAY_ACCESS_TOKEN || "OGE4Mjk0MTc0ZDA1OTViYjAxNGQwNWQ4MjllNzAxZDF8bk49a3NvQ3ROZjJacW9nOWYla0o="}`,
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
            'testMode': 'EXTERNAL' // للاختبار فقط
        };

        console.log("🚀 Preparing checkout with data:", paymentData);

        const response = await axios.post(`${HYPERPAY_CONFIG.baseUrl}/v1/checkouts`, paymentData, {
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

        const response = await axios.post(`${HYPERPAY_CONFIG.baseUrl}/v1/checkouts`, testData, {
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
