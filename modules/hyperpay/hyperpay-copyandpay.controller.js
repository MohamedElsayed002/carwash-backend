const axios = require('axios');
const querystring = require('querystring');

// HyperPay Configuration
const HYPERPAY_CONFIG = {
    BASE_URL: process.env.HYPERPAY_BASE_URL || 'https://eu-test.oppwa.com',
    ACCESS_TOKEN: process.env.HYPERPAY_ACCESS_TOKEN || 'OGE4Mjk0MTc0ZDA1OTViYjAxNGQwNWQ4MjllNzAxZDF8bk49a3NvQ3ROZjJacW9nOWYla0o=',
    ENTITY_ID: process.env.HYPERPAY_ENTITY_ID || '8a8294174d0595bb014d05d829cb01cd',
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
            const postData = querystring.stringify(data);
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
            const postData = querystring.stringify(data);
            request.write(postData);
        }

        request.end();
    });
};

// Step 1: Prepare checkout (Server-to-Server)
const prepareCheckout = async (req, res) => {
    try {
        const { amount, currency = 'SAR', paymentType = 'DB', customer, billing } = req.body;

        console.log('📤 Preparing checkout with HyperPay:', {
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

        console.log('📥 HyperPay checkout response:', {
            success: response.result?.code === '000.200.100',
            checkoutId: response.id,
            resultCode: response.result?.code,
            description: response.result?.description
        });

        if (response.result && response.result.code === '000.200.100') {
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

// Step 2: Create payment form (Frontend)
const createPaymentForm = async (req, res) => {
    try {
        const { checkoutId, integrity, shopperResultUrl } = req.body;

        console.log('📝 Creating payment form for checkout:', checkoutId);

        if (!checkoutId) {
            return res.status(400).json({
                success: false,
                message: 'Checkout ID is required'
            });
        }

        const resultUrl = shopperResultUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-result`;

        const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HyperPay Payment - Car Washer Service</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 30px;
        }
        .payment-notice {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            text-align: center;
        }
        .payment-notice h3 {
            color: #92400e;
            margin: 0 0 10px 0;
            font-size: 18px;
        }
        .payment-notice p {
            color: #78350f;
            margin: 0;
            font-size: 14px;
        }
        .security-info {
            background: #ecfdf5;
            border: 1px solid #10b981;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            text-align: center;
        }
        .security-info h3 {
            color: #065f46;
            margin: 0 0 10px 0;
            font-size: 18px;
        }
        .security-info p {
            color: #047857;
            margin: 0;
            font-size: 14px;
        }
        .test-cards {
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
        }
        .test-cards h3 {
            color: #374151;
            margin: 0 0 15px 0;
            font-size: 16px;
            text-align: center;
        }
        .card-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            font-size: 12px;
        }
        .card-type {
            background: white;
            padding: 10px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .card-type h4 {
            margin: 0 0 5px 0;
            color: #1f2937;
            font-size: 14px;
        }
        .card-details {
            color: #6b7280;
            line-height: 1.4;
        }
        .payment-form {
            background: #f9fafb;
            border-radius: 12px;
            padding: 20px;
            border: 2px dashed #d1d5db;
        }
        .form-placeholder {
            text-align: center;
            color: #6b7280;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💳 الدفع الآمن مع HyperPay</h1>
        </div>
        
        <div class="content">
            <!-- 3D Secure Notice -->
            <div class="payment-notice">
                <h3>🔒 مصادقة 3D Secure</h3>
                <p>قد يتم توجيهك لصفحة البنك للمصادقة الإضافية. هذا إجراء أماني طبيعي.</p>
            </div>

            <!-- Security Info -->
            <div class="security-info">
                <h3>🛡️ الدفع آمن 100%</h3>
                <p>جميع المعاملات محمية بتقنيات التشفير المتقدمة من HyperPay</p>
            </div>

            <!-- Test Cards Info -->
            <div class="test-cards">
                <h3>💳 بطاقات الاختبار</h3>
                <div class="card-info">
                    <div class="card-type">
                        <h4>VISA (نجاح)</h4>
                        <div class="card-details">
                            الرقم: 4440000009900010<br>
                            CVV: 100<br>
                            التاريخ: 01/39<br>
                            الاسم: Any Name
                        </div>
                    </div>
                    <div class="card-type">
                        <h4>MADA (نجاح)</h4>
                        <div class="card-details">
                            الرقم: 5360230159427034<br>
                            CVV: 850<br>
                            التاريخ: 11/25<br>
                            الاسم: Any Name
                        </div>
                    </div>
                </div>
            </div>

            <!-- Payment Form -->
            <div class="payment-form">
                <div class="form-placeholder">
                    نموذج الدفع سيظهر هنا...
                </div>
            </div>
        </div>
    </div>

    <!-- HyperPay Widget Script -->
    <script src="https://eu-test.oppwa.com/v1/paymentWidgets.js?checkoutId=${checkoutId}" integrity="${integrity}" crossorigin="anonymous"></script>
    
    <!-- Payment Form -->
    <form action="${resultUrl}" class="paymentWidgets" data-brands="MADA VISA MASTER AMEX"></form>

    <script>
        // HyperPay Widget Options
        var wpwlOptions = {
            style: "card",
            brandDetection: true,
            paymentTarget: "_top",
            onReady: function () {
                console.log("✅ HyperPay payment form ready with 3D Secure");
                document.querySelector('.form-placeholder').style.display = 'none';
            },
            onError: function (error) {
                console.error("❌ HyperPay payment error:", error);
            },
            onBeforeSubmit: function () {
                console.log("🔄 Payment submission started with 3D Secure");
                return true;
            },
            // 3D Secure specific options
            threeDSecure: {
                mode: "EXTERNAL",
                challengeWindowSize: "02",
                redirectUrl: "${resultUrl}"
            }
        };

        // Log widget loading
        console.log("🚀 Loading HyperPay widget with checkout ID:", "${checkoutId}");
        console.log("🔒 3D Secure: Auto-enabled by HyperPay");
    </script>
</body>
</html>`;

        res.json({
            success: true,
            message: 'Payment form created successfully with 3D Secure support',
            data: {
                html: html,
                checkoutId: checkoutId,
                integrity: integrity,
                resultUrl: resultUrl
            }
        });

    } catch (error) {
        console.error('❌ Create payment form error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment form',
            error: error.message
        });
    }
};

// Step 3: Get payment status
const getPaymentStatus = async (req, res) => {
    try {
        const { resourcePath } = req.query;
        const { checkoutId } = req.params;

        console.log('🔍 Getting payment status:', { resourcePath, checkoutId });

        if (!resourcePath && !checkoutId) {
            return res.status(400).json({
                success: false,
                message: 'Either resourcePath or checkoutId is required'
            });
        }

        let path;
        if (resourcePath) {
            path = resourcePath;
        } else {
            path = `/v1/checkouts/${checkoutId}/payment`;
        }

        // Add entityId parameter
        path += path.includes('?') ? '&' : '?';
        path += `entityId=${HYPERPAY_CONFIG.ENTITY_ID}`;

        const response = await makeHyperPayRequest(path, {}, 'GET');

        console.log('📊 Payment status response:', {
            resultCode: response.result?.code,
            description: response.result?.description,
            success: response.result?.code?.startsWith('000.')
        });

        // Check for session not found error
        if (response.result && response.result.code === '200.300.404') {
            console.log('⚠️ Payment session not found - possible causes:');
            console.log('   1. Session expired (30 minutes timeout)');
            console.log('   2. Incorrect resourcePath or checkoutId');
            console.log('   3. Test/live environment mismatch');

            return res.json({
                success: false,
                status: 'error',
                message: 'Payment session expired or not found. Please try again or contact support.',
                errorCode: '200.300.404',
                data: response
            });
        }

        // Check if payment was successful (only truly successful codes)
        const successCodes = [
            '000.100.110', // Success
            '000.000.000', // Success
            '000.100.112', // Success (Connector Test Mode)
            '000.200.100', // Success (Checkout created)
        ];

        const isSuccess = response.result && successCodes.includes(response.result.code);

        if (isSuccess) {
            // Process successful payment
            await processSuccessfulPayment(response, req);
        }

        // Enhanced status determination logic
        let status = 'pending';
        let message = 'Payment is being processed';

        if (isSuccess) {
            status = 'success';
            message = 'Payment completed successfully';
        } else if (response.result && response.result.code) {
            const resultCode = response.result.code;

            // Check for specific status codes with better handling
            if (resultCode === '000.200.000') {
                status = 'pending';
                message = 'Transaction pending - payment is being processed';
            } else if (resultCode === '000.100.110' || resultCode === '000.000.000') {
                // These are actually success codes, but might be returned as pending
                status = 'success';
                message = 'Payment completed successfully';
            } else if (resultCode.startsWith('800.') || resultCode.startsWith('900.')) {
                status = 'failed';
                message = response.result.description || 'Payment failed';
            } else if (resultCode.startsWith('200.')) {
                status = 'pending';
                message = 'Payment is being processed';
            } else {
                status = 'failed';
                message = response.result.description || 'Payment failed';
            }
        }

        // Additional check: if we have a payment ID, it's likely successful
        if (response.id && !isSuccess && status === 'pending') {
            console.log('🔍 Payment has ID but marked as pending, checking for success indicators...');

            // Check if this looks like a successful payment
            if (response.paymentType === 'DB' && response.paymentBrand) {
                console.log('✅ Payment has valid payment type and brand, treating as success');
                status = 'success';
                message = 'Payment completed successfully';
            }
        }

        res.json({
            success: isSuccess, // Only true when payment is actually successful
            status: status,
            message: message,
            data: response
        });

    } catch (error) {
        console.error('❌ Get payment status error:', error);
        res.status(500).json({
            success: false,
            status: 'error',
            message: 'Failed to get payment status',
            error: error.message
        });
    }
};

// Process successful payment
const processSuccessfulPayment = async (paymentResponse, req) => {
    try {
        console.log('✅ Processing successful payment:', {
            paymentId: paymentResponse.id,
            resultCode: paymentResponse.result?.code,
            amount: paymentResponse.amount,
            currency: paymentResponse.currency
        });

        // Here you can add your business logic:
        // - Update order status
        // - Send confirmation email
        // - Generate QR code
        // - Update user package
        // - etc.

        // For now, just log the success
        console.log('🎉 Payment processed successfully!');

    } catch (error) {
        console.error('❌ Process successful payment error:', error);
    }
};

// Test checkout endpoint
const testCheckout = async (req, res) => {
    try {
        const testData = {
            entityId: HYPERPAY_CONFIG.ENTITY_ID,
            amount: '92.00',
            currency: 'SAR',
            paymentType: 'DB',
            integrity: 'true',
            'customer.email': 'test@example.com',
            'customer.givenName': 'Test',
            'customer.surname': 'User',
            'billing.street1': 'Test Street',
            'billing.city': 'Riyadh',
            'billing.state': 'Riyadh',
            'billing.country': 'SA',
            'billing.postcode': '12345',
            testMode: 'EXTERNAL'
        };

        const response = await makeHyperPayRequest('/v1/checkouts', testData);

        res.json({
            success: true,
            message: 'Test checkout created successfully with 3D Secure',
            data: response
        });

    } catch (error) {
        console.error('Test checkout error:', error);
        res.status(500).json({
            success: false,
            error: 'Test checkout failed',
            details: error.message
        });
    }
};

// Health check endpoint
const healthCheck = async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'HyperPay service is healthy',
            data: {
                environment: HYPERPAY_CONFIG.TEST_MODE ? 'test' : 'production',
                baseUrl: HYPERPAY_CONFIG.BASE_URL,
                entityId: HYPERPAY_CONFIG.ENTITY_ID,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            success: false,
            error: 'Health check failed',
            details: error.message
        });
    }
};

// Test payment result endpoint
const testPaymentResult = async (req, res) => {
    try {
        const { resourcePath, checkoutId } = req.body;

        if (!resourcePath && !checkoutId) {
            return res.status(400).json({
                success: false,
                error: 'Either resourcePath or checkoutId is required'
            });
        }

        let path;
        if (resourcePath) {
            path = resourcePath;
        } else {
            path = `/v1/checkouts/${checkoutId}/payment`;
        }

        // Add entityId parameter
        path += path.includes('?') ? '&' : '?';
        path += `entityId=${HYPERPAY_CONFIG.ENTITY_ID}`;

        const response = await makeHyperPayRequest(path, {}, 'GET');

        res.json({
            success: true,
            message: 'Test payment result retrieved successfully',
            data: response
        });

    } catch (error) {
        console.error('Test payment result error:', error);
        res.status(500).json({
            success: false,
            error: 'Test payment result failed',
            details: error.message
        });
    }
};

module.exports = {
    prepareCheckout,
    createPaymentForm,
    getPaymentStatus,
    testCheckout,
    healthCheck,
    testPaymentResult
};
