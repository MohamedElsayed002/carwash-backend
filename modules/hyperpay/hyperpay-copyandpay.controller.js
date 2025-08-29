const axios = require('axios');
const querystring = require('querystring');
const qs = require('qs');
const crypto = require('crypto');

// HyperPay Configuration - PRODUCTION
const HYPERPAY_CONFIG = {
    BASE_URL: 'https://eu-prod.oppwa.com',  // Updated to production URL
    ACCESS_TOKEN: 'OGFjOWE0Y2Q5N2VlODI1NjAxOTgxMjMxMmU4ODI0ZDN8UlkrTTdFUXJMQ0prV015OlllPSM=',
    ENTITY_ID: '8ac9a4cd97ee825601981231c8f724df',
};

// Helper function to make HyperPay requests
const makeHyperPayRequest = (path, data = {}, method = 'POST') => {
    return new Promise((resolve, reject) => {
        const options = {
            port: 443,
            host: HYPERPAY_CONFIG.BASE_URL.replace('https://', ''),
            path: path,
            method: method,
            headers: {
                'Authorization': `Bearer ${HYPERPAY_CONFIG.ACCESS_TOKEN}`
            }
        };

        if (method === 'POST') {
            const postData = qs.stringify(data);
            options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            options.headers['Content-Length'] = postData.length;
        }

        const request = require('https').request(options, function (res) {
            const buf = [];
            res.on('data', chunk => {
                buf.push(Buffer.from(chunk));
            });
            res.on('end', () => {
                const jsonString = Buffer.concat(buf).toString('utf8');
                try {
                    resolve(JSON.parse(jsonString));
                } catch (error) {
                    reject(error);
                }
            });
        });

        request.on('error', reject);

        if (method === 'POST' && data) {
            const postData = qs.stringify(data);
            request.write(postData);
        }

        request.end();
    });
};

// Step 1: Prepare checkout (Server-to-Server) - UPDATED FOR PRODUCTION
exports.prepareCheckout = async (req, res) => {
    try {
        const { amount, customer, billing } = req.body;

        // Generate unique merchantTransactionId
        const merchantTransactionId = req.body.merchantTransactionId || `TXN_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

        // Validate required fields
        if (!amount || !customer || !billing) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields",
                message: "Amount, customer, and billing information are required"
            });
        }

        // Validate customer fields
        if (!customer.email || !customer.givenName || !customer.surname) {
            return res.status(400).json({
                success: false,
                error: "Missing customer information",
                message: "Customer email, given name, and surname are required"
            });
        }

        // Validate billing fields
        if (!billing.street1 || !billing.city || !billing.state || !billing.country || !billing.postcode) {
            return res.status(400).json({
                success: false,
                error: "Missing billing information",
                message: "All billing fields are required (street1, city, state, country, postcode)"
            });
        }

        // Prepare payload for production (removed testMode and 3DS2_enrolled)
        const payload = {
            entityId: HYPERPAY_CONFIG.ENTITY_ID,
            amount: Number(amount).toFixed(2),
            currency: "SAR",  // Fixed to SAR as per requirements
            paymentType: "DB", // Fixed to DB as per requirements
            merchantTransactionId: merchantTransactionId,
            'customer.email': customer.email,
            'customer.givenName': customer.givenName,
            'customer.surname': customer.surname,
            'billing.street1': billing.street1,
            'billing.city': billing.city,
            'billing.state': billing.state,
            'billing.country': billing.country, // Should be Alpha-2 code (e.g., "SA" for Saudi Arabia)
            'billing.postcode': billing.postcode
        };

        const response = await makeHyperPayRequest('/v1/checkouts', payload);

        if (response.result && response.result.code === '000.200.100') {
            res.json({
                success: true,
                status: 'success',
                message: 'Checkout prepared successfully',
                data: {
                    checkoutId: response.id,
                    merchantTransactionId: merchantTransactionId,
                    integrity: response.integrity,
                    ndc: response.ndc,
                    buildNumber: response.buildNumber,
                    timestamp: response.timestamp
                }
            });
        } else {
            res.status(400).json({
                success: false,
                status: 'failed',
                message: 'Failed to prepare checkout',
                error: response.result?.description || 'Unknown error',
                data: response
            });
        }

    } catch (error) {
        console.error('❌ Prepare checkout error:', error);
        res.status(500).json({
            success: false,
            status: 'error',
            message: 'Internal server error during checkout preparation',
            error: error.message
        });
    }
};

// Step 2: Create Checkout Form - UPDATED FOR PRODUCTION
exports.createCheckoutForm = async (req, res) => {
    try {
        const { checkoutId } = req.params;
        const { userId } = req.query;

        // Update shopperResult URL for production
        const shopperResult = `${process.env.BACKEND_URL || 'https://your-production-domain.com'}/api/hyperpay/payment-result${userId ? '?userId=' + userId : ''}`;

        if (!checkoutId) {
            return res.status(400).json({
                success: false,
                error: "معرف الدفع مطلوب"
            });
        }

        // HTML page for PRODUCTION - no test cards info
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
        .warning-info {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .warning-info h4 {
            color: #92400e;
            margin: 0 0 10px 0;
        }
        .warning-info p {
            color: #92400e;
            margin: 5px 0;
            font-size: 14px;
        }
    </style>
    <!-- PRODUCTION Widget Script -->
    <script type="text/javascript" src="https://eu-prod.oppwa.com/v1/paymentWidgets.js?checkoutId=${checkoutId}"></script>
    <script type="text/javascript" src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"></script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💳 نموذج الدفع الآمن</h1>
            <p>أدخل بيانات بطاقتك الائتمانية لإتمام عملية الدفع</p>
        </div>
        
        <div class="warning-info">
            <h4>⚠️ تنبيه مهم:</h4>
            <p>هذا نظام دفع حقيقي. سيتم خصم المبلغ من بطاقتك الائتمانية.</p>
            <p>الحد الأدنى للاختبار: 5 ريال سعودي</p>
        </div>
        
        <div class="payment-form">
            <form action="${shopperResult}" class="paymentWidgets" data-brands="VISA MASTER MADA">
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

// Step 3: Payment Result - UPDATED FOR PRODUCTION
exports.paymentResult = async (req, res) => {
    console.log('Payment Result Request:', req.query);
    console.log('userId', req.query.userId);

    try {
        const { id, resourcePath, userId } = req.query;

        if (!id || !resourcePath) {
            return res.status(400).send('Missing payment parameters');
        }

        const path = resourcePath;
        const queryParams = querystring.stringify({
            entityId: HYPERPAY_CONFIG.ENTITY_ID
        });

        const options = {
            port: 443,
            host: HYPERPAY_CONFIG.BASE_URL.replace('https://', ''),
            path: `${path}?${queryParams}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${HYPERPAY_CONFIG.ACCESS_TOKEN}`
            }
        };

        const response = await new Promise((resolve, reject) => {
            const getRequest = require('https').request(options, function (hpRes) {
                const buf = [];
                hpRes.on("data", (chunk) => {
                    buf.push(Buffer.from(chunk));
                });
                hpRes.on("end", () => {
                    const jsonString = Buffer.concat(buf).toString("utf8");
                    try {
                        resolve(JSON.parse(jsonString));
                    } catch (error) {
                        reject(error);
                    }
                });
            });
            getRequest.on("error", reject);
            getRequest.end();
        });

        console.log('Payment Result Response:', JSON.stringify(response, null, 2));

        // Check if payment was successful
        const isSuccess = response.result && (
            response.result.code === "000.000.000" || // Transaction succeeded
            response.result.code === "000.000.100" || // successful request
            response.result.code === "000.100.110" || // Request successfully processed
            response.result.code === "000.100.111" || // Request successfully processed
            response.result.code === "000.100.112" || // Request successfully processed
            response.result.code === "000.300.000" || // Two-step transaction succeeded
            response.result.code === "000.300.100" || // Risk check successful
            response.result.code === "000.300.101" || // Risk bank account check successful
            response.result.code === "000.300.102" || // Risk report successful
            response.result.code === "000.300.103" || // Exemption check successful
            response.result.code === "000.310.100" || // Account updated
            response.result.code === "000.310.101" || // Account updated
            response.result.code === "000.310.110" || // No updates found, but account is valid
            response.result.code === "000.400.000" || // Transaction succeeded (manual review)
            response.result.code === "000.400.010" || // Transaction succeeded (manual review)
            response.result.code === "000.400.020" || // Transaction succeeded (manual review)
            response.result.code === "000.400.040" || // Transaction succeeded (manual review)
            response.result.code === "000.400.050" || // Transaction succeeded (manual review)
            response.result.code === "000.400.060" || // Transaction succeeded (manual review)
            response.result.code === "000.400.070" || // Transaction succeeded (manual review)
            response.result.code === "000.400.080" || // Transaction succeeded (manual review)
            response.result.code === "000.400.090" || // Transaction succeeded (manual review)
            response.result.code === "000.400.100" || // Transaction succeeded
            response.result.code === "000.400.110" || // Authentication successful
            response.result.code === "000.400.120" || // Authentication successful
            response.result.code === "000.600.000"    // Transaction succeeded due to external update
        );

        // Update user's isPaid status if payment was successful
        if (isSuccess && userId) {
            try {
                const User = require('../user/user.model');
                await User.findByIdAndUpdate(userId, { isPaid: true });
                console.log(`✅ Updated user ${userId} isPaid status to true`);
            } catch (userUpdateError) {
                console.error('❌ Error updating user isPaid status:', userUpdateError);
            }
        }

        // Updated redirect URLs for production
        const frontendUrl = process.env.FRONTEND_URL || 'https://your-production-domain.com';

        const html = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>نتيجة الدفع</title>
                <style>
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        padding: 20px; 
                        text-align: center; 
                        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                        margin: 0;
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
                    .success { color: #059669; }
                    .error { color: #dc2626; }
                    .status-icon {
                        font-size: 48px;
                        margin-bottom: 20px;
                    }
                    .btn {
                        background: #059669;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 10px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        margin: 10px;
                        text-decoration: none;
                        display: inline-block;
                    }
                    .btn:hover {
                        background: #047857;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="status-icon">
                        ${isSuccess ? '✅' : '❌'}
                    </div>
                    <h2 class="${isSuccess ? 'success' : 'error'}">
                        ${isSuccess ? 'تم الدفع بنجاح!' : 'فشل في الدفع'}
                    </h2>
                    <p>معرف المعاملة: ${id}</p>
                    <p>الحالة: ${response.result.description}</p>
                    
                    <div style="margin-top: 30px;">
                        ${isSuccess ?
                `<a href="${frontendUrl}/qr-generated/" class="btn">العودة للتطبيق</a>` :
                `<a href="${frontendUrl}/payment-form/${id}?status=failed&checkoutId=${id}${userId ? '&userId=' + userId : ''}" class="btn">العودة للتطبيق</a>`
            }
                    </div>
                </div>
            </body>
            </html>
        `;

        res.send(html);

    } catch (error) {
        console.error('Payment Result Error:', error);
        res.status(500).send('Error processing payment result');
    }
};


exports.checkStatus = async (req, res) => {
    try {
        const { paymentId } = req.params;
        
        if (!paymentId) {
            return res.status(400).json({
                success: false,
                error: 'Payment ID is required'
            });
        }

        const path = `/v1/payments/${paymentId}`;
        const queryParams = querystring.stringify({
            entityId: HYPERPAY_CONFIG.entityId
        });

        const options = {
            port: 443,
            host: HYPERPAY_CONFIG.host,
            path: `${path}?${queryParams}`,
            method: "GET",
            headers: {
                Authorization: `Bearer ${HYPERPAY_CONFIG.authToken}`
            }
        };

        const response = await new Promise((resolve, reject) => {
            const getRequest = https.request(options, function (hpRes) {
                const buf = [];
                hpRes.on("data", (chunk) => {
                    buf.push(Buffer.from(chunk));
                });
                hpRes.on("end", () => {
                    const jsonString = Buffer.concat(buf).toString("utf8");
                    try {
                        resolve(JSON.parse(jsonString));
                    } catch (error) {
                        reject(error);
                    }
                });
            });
            getRequest.on("error", reject);
            getRequest.end();
        });

        const successCodes = ["000.000.000", "000.100.110", "000.100.111", "000.100.112"];
        const isSuccess = response.result && successCodes.includes(response.result.code);

        res.json({
            success: true,
            paymentId: paymentId,
            status: isSuccess ? 'success' : 'failed',
            data: response,
            message: isSuccess ? 'Payment successful' : 'Payment failed or pending'
        });

    } catch (error) {
        console.error('Transaction status check error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check transaction status',
            details: error.message
        });
    }
}