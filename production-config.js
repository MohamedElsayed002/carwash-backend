// Production Configuration for HyperPay Integration
module.exports = {
    // HyperPay Production Configuration
    hyperpay: {
        BASE_URL: 'https://oppwa.com',
        ACCESS_TOKEN: process.env.HYPERPAY_ACCESS_TOKEN || 'YOUR_PRODUCTION_ACCESS_TOKEN',
        ENTITY_ID: process.env.HYPERPAY_ENTITY_ID || 'YOUR_PRODUCTION_ENTITY_ID',
        TEST_MODE: false
    },

    // Application Configuration
    app: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 5000,
        CORS_ORIGIN: process.env.CORS_ORIGIN || 'https://your-production-domain.com'
    },

    // Database Configuration
    database: {
        MONGODB_URI: process.env.MONGODB_URI || 'YOUR_PRODUCTION_MONGODB_URI'
    },

    // Security Configuration
    security: {
        JWT_SECRET: process.env.JWT_SECRET || 'YOUR_PRODUCTION_JWT_SECRET',
        SESSION_SECRET: process.env.SESSION_SECRET || 'YOUR_PRODUCTION_SESSION_SECRET'
    },

    // Frontend Configuration
    frontend: {
        API_URL: process.env.REACT_APP_API_URL || 'https://your-production-domain.com/api'
    },

    // Payment Configuration
    payment: {
        CURRENCY: 'SAR',
        SUPPORTED_BRANDS: ['MADA', 'VISA', 'MASTER'],
        LOCALE: 'ar',
        SECURE_3D: true
    }
};
