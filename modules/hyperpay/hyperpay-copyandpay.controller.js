const axios = require('axios');
const querystring = require('querystring');
const qs = require('qs');

// HyperPay Configuration
const HYPERPAY_CONFIG = {
    BASE_URL: process.env.HYPERPAY_BASE_URL || 'https://eu-prod.oppwa.com',
    ACCESS_TOKEN: process.env.HYPERPAY_ACCESS_TOKEN || 'OGFjN2E0Yzg5N2Y5MmJhMDAxOTgwMzdiOTFlYzA1YTN8NWEjekt5d00yUFJiYWVnakthNDU',
    ENTITY_ID: '8ac7a4c897f92ba00198037be75705a7',
    TEST_MODE: process.env.NODE_ENV !== 'production'
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

// Step 1: Prepare checkout (Server-to-Server)
exports.prepareCheckout = async (req, res) => {
    try {
        const { amount, currency = 'SAR', paymentType = 'DB', customer, billing } = req.body;

        const payload = {
            entityId: HYPERPAY_CONFIG.ENTITY_ID,
            amount: Number(amount).toFixed(2),
            currency,
            paymentType,
            integrity: 'true'
        };

        // Add customer information if provided
        if (customer) {
            if (customer.email) payload['customer.email'] = customer.email;
            if (customer.givenName) payload['customer.givenName'] = customer.givenName;
            if (customer.surname) payload['customer.surname'] = customer.surname;
        }

        // Add billing information if provided
        if (billing) {
            if (billing.street1) payload['billing.street1'] = billing.street1;
            if (billing.city) payload['billing.city'] = billing.city;
            if (billing.state) payload['billing.state'] = billing.state;
            if (billing.country) payload['billing.country'] = billing.country;
            if (billing.postcode) payload['billing.postcode'] = billing.postcode;
        }

        const response = await makeHyperPayRequest('/v1/checkouts', payload);

        if (response.result && response.result.code === '000.200.100') {
            // Checkout prepared successfully - do NOT set isPaid to true yet
            // isPaid should only be set to true after successful payment completion

            res.json({
                success: true,
                status: 'success',
                message: 'Checkout prepared successfully with 3D Secure support',
                data: {
                    checkoutId: response.id,
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




// Step 2 Create Checkout Form
exports.createCheckoutForm = async (req, res) => {
    try {
        const { checkoutId } = req.params;
        const { userId } = req.query; // Get userId from query parameters
        console.log('userId', userId)
        const shopperResult = `https://carwash-backend-production.up.railway.app/api/hyperpay/payment-result${userId ? '?userId=' + userId : ''}`

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
        .test-info {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .test-info h4 {
            color: #92400e;
            margin: 0 0 10px 0;
        }
        .test-info p {
            color: #92400e;
            margin: 5px 0;
            font-size: 14px;
        }
    </style>
    <script type="text/javascript" src="https://eu-prod.oppwa.com/v1/paymentWidgets.js?checkoutId=${checkoutId}"></script>
    <script type="text/javascript" src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"></script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💳 نموذج الدفع الآمن</h1>
            <p>أدخل بيانات بطاقتك الائتمانية لإتمام عملية الدفع</p>
        </div>
        
        <div class="test-info">
            <h4>🧪 بيانات الاختبار:</h4>
            <p><strong>VISA:</strong> 4200000000000000</p>
            <p><strong>MasterCard:</strong> 5454545454545454</p>
            <p><strong>CVV:</strong> 123 | <strong>Expiry:</strong> 12/25</p>
            <p><strong>Name:</strong> John Doe</p>
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

// Step 3 Payment Result
exports.paymentResult = async (req, res) => {
    console.log('ANA Hana ya john', req.query.user)
    console.log('Payment Result Request:', req.query);
    console.log('userIddddd', req.query.userId)
    try {
        const { id, resourcePath, userId } = req.query;

        if (!id || !resourcePath) {
            return res.status(400).send('Missing payment parameters');
        }

        const path = resourcePath;
        const queryParams = querystring.stringify({
            entityId: HYPERPAY_CONFIG.ENTITY_ID
        })

        const options = {
            port: 443,
            host: HYPERPAY_CONFIG.BASE_URL.replace('https://', ''),
            path: `${path}?${queryParams}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${HYPERPAY_CONFIG.ACCESS_TOKEN}`
            }
        }

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

        // Check if payment was successful - Updated with all HyperPay success codes
        const isSuccess = response.result && (
            // Standard success codes
            response.result.code === "000.000.000" || // Transaction succeeded
            response.result.code === "000.000.100" || // successful request
            response.result.code === "000.100.105" || // Chargeback Representment is successful
            response.result.code === "000.100.106" || // Chargeback Representment cancellation is successful
            response.result.code === "000.100.110" || // Request successfully processed in 'Merchant in Integrator Test Mode'
            response.result.code === "000.100.111" || // Request successfully processed in 'Merchant in Validator Test Mode'
            response.result.code === "000.100.112" || // Request successfully processed in 'Merchant in Connector Test Mode'
            response.result.code === "000.300.000" || // Two-step transaction succeeded
            response.result.code === "000.300.100" || // Risk check successful
            response.result.code === "000.300.101" || // Risk bank account check successful
            response.result.code === "000.300.102" || // Risk report successful
            response.result.code === "000.300.103" || // Exemption check successful
            response.result.code === "000.310.100" || // Account updated
            response.result.code === "000.310.101" || // Account updated (Credit card expired)
            response.result.code === "000.310.110" || // No updates found, but account is valid
            response.result.code === "000.400.110" || // Authentication successful (frictionless flow)
            response.result.code === "000.400.120" || // Authentication successful (data only flow)
            response.result.code === "000.600.000" || // transaction succeeded due to external update
            // Manual review success codes (still considered successful)
            response.result.code === "000.400.000" || // Transaction succeeded (please review manually due to fraud suspicion)
            response.result.code === "000.400.010" || // Transaction succeeded (please review manually due to AVS return code)
            response.result.code === "000.400.020" || // Transaction succeeded (please review manually due to CVV return code)
            response.result.code === "000.400.040" || // Transaction succeeded (please review manually due to amount mismatch)
            response.result.code === "000.400.050" || // Transaction succeeded (please review manually because transaction is pending)
            response.result.code === "000.400.060" || // Transaction succeeded (approved at merchant's risk)
            response.result.code === "000.400.070" || // Transaction succeeded (waiting for external risk review)
            response.result.code === "000.400.080" || // Transaction succeeded (please review manually because the service was unavailable)
            response.result.code === "000.400.081" || // Transaction succeeded (please review manually, as the risk status not available yet due network timeout)
            response.result.code === "000.400.082" || // Transaction succeeded (please review manually, as the risk status not available yet due processing timeout)
            response.result.code === "000.400.090" || // Transaction succeeded (please review manually due to external risk check)
            response.result.code === "000.400.100"    // Transaction succeeded, risk after payment rejected
        );

        // Update user's isPaid status if payment was successful
        if (isSuccess && userId) {
            try {
                const User = require('../user/user.model');
                await User.findByIdAndUpdate(userId, { isPaid: true });
                console.log(`✅ Updated user ${userId} isPaid status to true in payment result`);
            } catch (userUpdateError) {
                console.error('❌ Error updating user isPaid status in payment result:', userUpdateError);
            }
        } else if (isSuccess) {
            console.log('✅ Payment successful but no userId provided - isPaid status will be updated when user accesses their profile');
        }

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
                '<a href="' + (process.env.FRONTEND_URL || 'http://localhost:3000') + '/qr-generated/' + '" class="btn">العودة للتطبيق</a>' :
                '<a href="' + (process.env.FRONTEND_URL || 'http://localhost:3000') + '/payment-form/' + id + '?status=failed&checkoutId=' + id + (userId ? '&userId=' + userId : '') + '" class="btn">العودة للتطبيق</a>'
            }
                    </div>
                </div>
            </body>
            </html>
            `;

        res.send(html);

    } catch (error) {
        console.log('Payment Result Error', error)
    }
}

exports.checkStatus = async (req, res) => {
    try {
        const { checkoutId } = req.query;

        console.log("🔍 Checking payment status:", checkoutId);

        if (!checkoutId) {
            return res.status(400).json({
                success: false,
                error: "معرف الدفع مطلوب"
            });
        }

        // Query HyperPay to get payment status
        const path = `/v1/checkouts/${checkoutId}/payment`;
        const queryParams = querystring.stringify({
            entityId: HYPERPAY_CONFIG.ENTITY_ID
        });

        const options = {
            port: 443,
            host: HYPERPAY_CONFIG.BASE_URL.replace('https://', ''),
            path: `${path}?${queryParams}`,
            method: "GET",
            headers: {
                Authorization: `Bearer ${HYPERPAY_CONFIG.ACCESS_TOKEN}`
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

        console.log('Payment Status Response:', JSON.stringify(response, null, 2));

        // Handle specific error cases
        if (response.result && response.result.code === "200.300.404") {
            return res.status(400).json({
                success: false,
                status: 'expired_or_invalid',
                error: "Payment session expired or invalid checkout ID",
                message: "The payment session has expired or the checkout ID is invalid. Please try creating a new payment.",
                data: response
            });
        }

        // Handle other error codes
        if (response.result && response.result.code && response.result.code.startsWith("200.")) {
            return res.status(400).json({
                success: false,
                status: 'error',
                error: response.result.description || "Payment verification failed",
                message: "There was an issue verifying the payment. Please try again.",
                data: response
            });
        }

        // Check if payment was successful - Updated with all HyperPay success codes
        const isSuccess = response.result && (
            // Standard success codes
            response.result.code === "000.000.000" || // Transaction succeeded
            response.result.code === "000.000.100" || // successful request
            response.result.code === "000.100.105" || // Chargeback Representment is successful
            response.result.code === "000.100.106" || // Chargeback Representment cancellation is successful
            response.result.code === "000.100.110" || // Request successfully processed in 'Merchant in Integrator Test Mode'
            response.result.code === "000.100.111" || // Request successfully processed in 'Merchant in Validator Test Mode'
            response.result.code === "000.100.112" || // Request successfully processed in 'Merchant in Connector Test Mode'
            response.result.code === "000.200.100" || // Checkout created successfully
            response.result.code === "000.300.000" || // Two-step transaction succeeded
            response.result.code === "000.300.100" || // Risk check successful
            response.result.code === "000.300.101" || // Risk bank account check successful
            response.result.code === "000.300.102" || // Risk report successful
            response.result.code === "000.300.103" || // Exemption check successful
            response.result.code === "000.310.100" || // Account updated
            response.result.code === "000.310.101" || // Account updated (Credit card expired)
            response.result.code === "000.310.110" || // No updates found, but account is valid
            response.result.code === "000.400.110" || // Authentication successful (frictionless flow)
            response.result.code === "000.400.120" || // Authentication successful (data only flow)
            response.result.code === "000.600.000" || // transaction succeeded due to external update
            // Manual review success codes (still considered successful)
            response.result.code === "000.400.000" || // Transaction succeeded (please review manually due to fraud suspicion)
            response.result.code === "000.400.010" || // Transaction succeeded (please review manually due to AVS return code)
            response.result.code === "000.400.020" || // Transaction succeeded (please review manually due to CVV return code)
            response.result.code === "000.400.040" || // Transaction succeeded (please review manually due to amount mismatch)
            response.result.code === "000.400.050" || // Transaction succeeded (please review manually because transaction is pending)
            response.result.code === "000.400.060" || // Transaction succeeded (approved at merchant's risk)
            response.result.code === "000.400.070" || // Transaction succeeded (waiting for external risk review)
            response.result.code === "000.400.080" || // Transaction succeeded (please review manually because the service was unavailable)
            response.result.code === "000.400.081" || // Transaction succeeded (please review manually, as the risk status not available yet due network timeout)
            response.result.code === "000.400.082" || // Transaction succeeded (please review manually, as the risk status not available yet due processing timeout)
            response.result.code === "000.400.090" || // Transaction succeeded (please review manually due to external risk check)
            response.result.code === "000.400.100"    // Transaction succeeded, risk after payment rejected
        );

        // Update user's isPaid status if payment was successful and user is authenticated
        if (isSuccess && req.user) {
            try {
                const User = require('../user/user.model');
                await User.findByIdAndUpdate(req.user._id, { isPaid: true });
                console.log(`✅ Updated user ${req.user._id} isPaid status to true in checkStatus`);
            } catch (userUpdateError) {
                console.error('❌ Error updating user isPaid status in checkStatus:', userUpdateError);
            }
        }

        res.json({
            success: true,
            status: isSuccess ? 'success' : 'failed',
            data: response,
            message: isSuccess ? 'Payment successful' : 'Payment failed or pending'
        });

    } catch (err) {
        console.error('Payment status error:', err);
        res.status(500).json({
            success: false,
            error: "فشل في التحقق من حالة الدفع",
            details: err.message
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
        const queryParams = querystring.stringify({
            entityId: HYPERPAY_CONFIG.ENTITY_ID
        });

        const options = {
            port: 443,
            host: HYPERPAY_CONFIG.BASE_URL.replace('https://', ''),
            path: `${resourcePath}?${queryParams}`,
            method: "GET",
            headers: {
                Authorization: `Bearer ${HYPERPAY_CONFIG.ACCESS_TOKEN}`
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

        const isSuccess = response.result && (
            // Standard success codes
            response.result.code === "000.000.000" || // Transaction succeeded
            response.result.code === "000.000.100" || // successful request
            response.result.code === "000.100.105" || // Chargeback Representment is successful
            response.result.code === "000.100.106" || // Chargeback Representment cancellation is successful
            response.result.code === "000.100.110" || // Request successfully processed in 'Merchant in Integrator Test Mode'
            response.result.code === "000.100.111" || // Request successfully processed in 'Merchant in Validator Test Mode'
            response.result.code === "000.100.112" || // Request successfully processed in 'Merchant in Connector Test Mode'
            response.result.code === "000.200.100" || // Checkout created successfully
            response.result.code === "000.300.000" || // Two-step transaction succeeded
            response.result.code === "000.300.100" || // Risk check successful
            response.result.code === "000.300.101" || // Risk bank account check successful
            response.result.code === "000.300.102" || // Risk report successful
            response.result.code === "000.300.103" || // Exemption check successful
            response.result.code === "000.310.100" || // Account updated
            response.result.code === "000.310.101" || // Account updated (Credit card expired)
            response.result.code === "000.310.110" || // No updates found, but account is valid
            response.result.code === "000.400.110" || // Authentication successful (frictionless flow)
            response.result.code === "000.400.120" || // Authentication successful (data only flow)
            response.result.code === "000.600.000" || // transaction succeeded due to external update
            // Manual review success codes (still considered successful)
            response.result.code === "000.400.000" || // Transaction succeeded (please review manually due to fraud suspicion)
            response.result.code === "000.400.010" || // Transaction succeeded (please review manually due to AVS return code)
            response.result.code === "000.400.020" || // Transaction succeeded (please review manually due to CVV return code)
            response.result.code === "000.400.040" || // Transaction succeeded (please review manually due to amount mismatch)
            response.result.code === "000.400.050" || // Transaction succeeded (please review manually because transaction is pending)
            response.result.code === "000.400.060" || // Transaction succeeded (approved at merchant's risk)
            response.result.code === "000.400.070" || // Transaction succeeded (waiting for external risk review)
            response.result.code === "000.400.080" || // Transaction succeeded (please review manually because the service was unavailable)
            response.result.code === "000.400.081" || // Transaction succeeded (please review manually, as the risk status not available yet due network timeout)
            response.result.code === "000.400.082" || // Transaction succeeded (please review manually, as the risk status not available yet due processing timeout)
            response.result.code === "000.400.090" || // Transaction succeeded (please review manually due to external risk check)
            response.result.code === "000.400.100"    // Transaction succeeded, risk after payment rejected
        );

        if (isSuccess) {
            // Redirect to payment form page with success status
            res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-form/${checkoutId}?status=success&checkoutId=${checkoutId}`);
        } else {
            // Redirect to payment form page with failed status
            res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-form/${checkoutId}?status=failed&checkoutId=${checkoutId}`);
        }

    } catch (error) {
        console.error("❌ Error in payment callback:", error);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-form/${checkoutId}?status=error`);
    }
};

// Handle payment success with user authentication
exports.handlePaymentSuccess = async (req, res) => {
    try {
        const { checkoutId } = req.body;

        if (!checkoutId) {
            return res.status(400).json({
                success: false,
                message: 'Checkout ID is required'
            });
        }

        // Verify payment status with HyperPay
        const path = `/v1/checkouts/${checkoutId}/payment`;
        const queryParams = querystring.stringify({
            entityId: HYPERPAY_CONFIG.ENTITY_ID
        });

        const options = {
            port: 443,
            host: HYPERPAY_CONFIG.BASE_URL.replace('https://', ''),
            path: `${path}?${queryParams}`,
            method: "GET",
            headers: {
                Authorization: `Bearer ${HYPERPAY_CONFIG.ACCESS_TOKEN}`
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

        console.log('Payment Status Response:', JSON.stringify(response, null, 2));

        // Handle specific error cases
        if (response.result && response.result.code === "200.300.404") {
            return res.status(400).json({
                success: false,
                status: 'expired_or_invalid',
                error: "Payment session expired or invalid checkout ID",
                message: "The payment session has expired or the checkout ID is invalid. Please try creating a new payment.",
                data: {
                    checkoutId,
                    paymentStatus: 'expired_or_invalid',
                    userId: req.user._id
                }
            });
        }

        // Handle other error codes
        if (response.result && response.result.code && response.result.code.startsWith("200.")) {
            return res.status(400).json({
                success: false,
                status: 'error',
                error: response.result.description || "Payment verification failed",
                message: "There was an issue verifying the payment. Please try again.",
                data: {
                    checkoutId,
                    paymentStatus: 'error',
                    userId: req.user._id
                }
            });
        }

        // Check if payment was successful - Updated with all HyperPay success codes
        const isSuccess = response.result && (
            // Standard success codes
            response.result.code === "000.000.000" || // Transaction succeeded
            response.result.code === "000.000.100" || // successful request
            response.result.code === "000.100.105" || // Chargeback Representment is successful
            response.result.code === "000.100.106" || // Chargeback Representment cancellation is successful
            response.result.code === "000.100.110" || // Request successfully processed in 'Merchant in Integrator Test Mode'
            response.result.code === "000.100.111" || // Request successfully processed in 'Merchant in Validator Test Mode'
            response.result.code === "000.100.112" || // Request successfully processed in 'Merchant in Connector Test Mode'
            response.result.code === "000.200.100" || // Checkout created successfully
            response.result.code === "000.300.000" || // Two-step transaction succeeded
            response.result.code === "000.300.100" || // Risk check successful
            response.result.code === "000.300.101" || // Risk bank account check successful
            response.result.code === "000.300.102" || // Risk report successful
            response.result.code === "000.300.103" || // Exemption check successful
            response.result.code === "000.310.100" || // Account updated
            response.result.code === "000.310.101" || // Account updated (Credit card expired)
            response.result.code === "000.310.110" || // No updates found, but account is valid
            response.result.code === "000.400.110" || // Authentication successful (frictionless flow)
            response.result.code === "000.400.120" || // Authentication successful (data only flow)
            response.result.code === "000.600.000" || // transaction succeeded due to external update
            // Manual review success codes (still considered successful)
            response.result.code === "000.400.000" || // Transaction succeeded (please review manually due to fraud suspicion)
            response.result.code === "000.400.010" || // Transaction succeeded (please review manually due to AVS return code)
            response.result.code === "000.400.020" || // Transaction succeeded (please review manually due to CVV return code)
            response.result.code === "000.400.040" || // Transaction succeeded (please review manually due to amount mismatch)
            response.result.code === "000.400.050" || // Transaction succeeded (please review manually because transaction is pending)
            response.result.code === "000.400.060" || // Transaction succeeded (approved at merchant's risk)
            response.result.code === "000.400.070" || // Transaction succeeded (waiting for external risk review)
            response.result.code === "000.400.080" || // Transaction succeeded (please review manually because the service was unavailable)
            response.result.code === "000.400.081" || // Transaction succeeded (please review manually, as the risk status not available yet due network timeout)
            response.result.code === "000.400.082" || // Transaction succeeded (please review manually, as the risk status not available yet due processing timeout)
            response.result.code === "000.400.090" || // Transaction succeeded (please review manually due to external risk check)
            response.result.code === "000.400.100"    // Transaction succeeded, risk after payment rejected
        );

        if (isSuccess) {
            // Update user's isPaid status to true
            if (req.user && req.user._id) {
                try {
                    const User = require('../user/user.model');
                    await User.findByIdAndUpdate(req.user._id, { isPaid: true });
                    console.log(`✅ Updated user ${req.user._id} isPaid status to true after payment success verification`);
                } catch (userUpdateError) {
                    console.error('❌ Error updating user isPaid status after payment success verification:', userUpdateError);
                }
            }

            res.json({
                success: true,
                message: 'Payment verified and user status updated successfully',
                data: {
                    checkoutId,
                    paymentStatus: 'success',
                    userId: req.user._id,
                    isPaid: true
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Payment verification failed',
                data: {
                    checkoutId,
                    paymentStatus: 'failed',
                    userId: req.user._id
                }
            });
        }

    } catch (error) {
        console.error('❌ Error in handlePaymentSuccess:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during payment verification',
            error: error.message
        });
    }
};

// Create fresh checkout when session expires
exports.createFreshCheckout = async (req, res) => {
    try {
        const { amount, currency = 'SAR', paymentType = 'DB', customer, billing } = req.body;

        console.log('🔄 Creating fresh checkout due to expired session:', {
            amount,
            currency,
            paymentType,
            customer: customer ? 'provided' : 'not provided',
            billing: billing ? 'provided' : 'not provided'
        });

        const payload = {
            entityId: HYPERPAY_CONFIG.ENTITY_ID,
            amount: Number(amount).toFixed(2),
            currency,
            paymentType,
            integrity: 'true'
        };

        // Add customer information if provided
        if (customer) {
            if (customer.email) payload['customer.email'] = customer.email;
            if (customer.givenName) payload['customer.givenName'] = customer.givenName;
            if (customer.surname) payload['customer.surname'] = customer.surname;
        }

        // Add billing information if provided
        if (billing) {
            if (billing.street1) payload['billing.street1'] = billing.street1;
            if (billing.city) payload['billing.city'] = billing.city;
            if (billing.state) payload['billing.state'] = billing.state;
            if (billing.country) payload['billing.country'] = billing.country;
            if (billing.postcode) payload['billing.postcode'] = billing.postcode;
        }

        const response = await makeHyperPayRequest('/v1/checkouts', payload);

        if (response.result && response.result.code === '000.200.100') {
            res.json({
                success: true,
                status: 'fresh_checkout_created',
                message: 'Fresh checkout created successfully',
                data: {
                    checkoutId: response.id,
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
                message: 'Failed to create fresh checkout',
                error: response.result?.description || 'Unknown error',
                data: response
            });
        }

    } catch (error) {
        console.error('❌ Create fresh checkout error:', error);
        res.status(500).json({
            success: false,
            status: 'error',
            message: 'Internal server error during fresh checkout creation',
            error: error.message
        });
    }
};