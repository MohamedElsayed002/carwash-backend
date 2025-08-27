const HYPERPAY_CONFIG = {
    // Test Environment
    TEST: {
        BASE_URL: 'https://eu-test.oppwa.com/v1',
        USER_ID: '8a8294174d0595bb014d05d829cb01cd',
        PASSWORD: 'OGE4Mjk0MTc0ZDA1OTViYjAxNGQwNWQ4MjllNzAxZDF8bk49a3NvQ3ROZjJacW9nOWYla0o=',
        ENTITY_ID: '8a8294174d0595bb014d05d829cb01cd'
    },
    // Production Environment
    PRODUCTION: {
        BASE_URL: 'https://eu-prod.oppwa.com/v1',
        USER_ID: process.env.HYPERPAY_USER_ID,
        PASSWORD: process.env.HYPERPAY_PASSWORD,
        ENTITY_ID: process.env.HYPERPAY_ENTITY_ID
    }
};

const getConfig = () => {
    return process.env.NODE_ENV === 'production' 
        ? HYPERPAY_CONFIG.PRODUCTION 
        : HYPERPAY_CONFIG.TEST;
};

module.exports = { HYPERPAY_CONFIG, getConfig };
