// Mock QR Code Data for Testing POST /api/user/scan-qr-code
// This shows what qrCodeData should contain

// ========================================
// WHAT IS qrCodeData?
// ========================================
// qrCodeData is the JSON string that gets encoded into the QR code
// When staff scans a QR code, they get this data back as a string
// This string needs to be sent to the API endpoint

// ========================================
// MOCK DATA EXAMPLES
// ========================================

// Example 1: User with 5 washes remaining
const mockQRCodeData1 = {
    "userId": "507f1f77bcf86cd799439011",
    "userName": "John Doe",
    "packageId": "507f1f77bcf86cd799439012",
    "packageName": "الباقة المتقدمة",
    "washesLeft": 5,
    "size": "medium",
    "timestamp": "2025-08-24T17:30:00.000Z",
    "type": "car_wash_package"
};

// Example 2: User with 1 wash remaining
const mockQRCodeData2 = {
    "userId": "507f1f77bcf86cd799439013",
    "userName": "Jane Smith",
    "packageId": "507f1f77bcf86cd799439014",
    "packageName": "الباقة الأساسية",
    "washesLeft": 1,
    "size": "small",
    "timestamp": "2025-08-24T18:45:00.000Z",
    "type": "car_wash_package"
};

// Example 3: User with 10 washes remaining
const mockQRCodeData3 = {
    "userId": "507f1f77bcf86cd799439015",
    "userName": "Ahmed Hassan",
    "packageId": "507f1f77bcf86cd799439016",
    "packageName": "الباقة المميزة",
    "washesLeft": 10,
    "size": "large",
    "timestamp": "2025-08-24T19:15:00.000Z",
    "type": "car_wash_package"
};

// ========================================
// HOW TO USE THESE IN API CALLS
// ========================================

// Method 1: Using fetch
const testWithFetch = async () => {
    const response = await fetch('http://localhost:3000/api/user/scan-qr-code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_TOKEN_HERE'
        },
        body: JSON.stringify({
            qrCodeData: JSON.stringify(mockQRCodeData1) // ← This is the key!
        })
    });

    const result = await response.json();
    console.log(result);
};

// Method 2: Using axios
const testWithAxios = async () => {
    const axios = require('axios');

    const response = await axios.post('http://localhost:3000/api/user/scan-qr-code', {
        qrCodeData: JSON.stringify(mockQRCodeData2) // ← This is the key!
    }, {
        headers: {
            'Authorization': 'Bearer YOUR_TOKEN_HERE'
        }
    });

    console.log(response.data);
};

// Method 3: Using Postman/cURL
const postmanExample = {
    method: 'POST',
    url: 'http://localhost:3000/api/user/scan-qr-code',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN_HERE'
    },
    body: {
        qrCodeData: JSON.stringify(mockQRCodeData3) // ← This is the key!
    }
};

// ========================================
// cURL COMMAND EXAMPLES
// ========================================

const curlCommand1 = `
curl -X POST http://localhost:3000/api/user/scan-qr-code \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\
  -d '{
    "qrCodeData": "{\\"userId\\":\\"507f1f77bcf86cd799439011\\",\\"userName\\":\\"John Doe\\",\\"packageId\\":\\"507f1f77bcf86cd799439012\\",\\"packageName\\":\\"الباقة المتقدمة\\",\\"washesLeft\\":5,\\"size\\":\\"medium\\",\\"timestamp\\":\\"2025-08-24T17:30:00.000Z\\",\\"type\\":\\"car_wash_package\\"}"
  }'
`;

const curlCommand2 = `
curl -X POST http://localhost:3000/api/user/scan-qr-code \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\
  -d '{
    "qrCodeData": "{\\"userId\\":\\"507f1f77bcf86cd799439013\\",\\"userName\\":\\"Jane Smith\\",\\"packageId\\":\\"507f1f77bcf86cd799439014\\",\\"packageName\\":\\"الباقة الأساسية\\",\\"washesLeft\\":1,\\"size\\":\\"small\\",\\"timestamp\\":\\"2025-08-24T18:45:00.000Z\\",\\"type\\":\\"car_wash_package\\"}"
  }'
`;

// ========================================
// EXPECTED RESPONSES
// ========================================

const expectedSuccessResponse = {
    "success": true,
    "message": "Wash used successfully",
    "data": {
        "userName": "John Doe",
        "packageName": "الباقة المتقدمة",
        "washesLeft": 4,
        "paidWashesLeft": 3,
        "freeWashesLeft": 1,
        "size": "medium",
        "scanTime": "2025-08-24T17:30:00.000Z"
    }
};

const expectedErrorResponse = {
    "success": false,
    "message": "No washes left in this package"
};

// ========================================
// TESTING DIFFERENT SCENARIOS
// ========================================

// Test 1: Valid QR code with washes remaining
const testValidQRCode = {
    qrCodeData: JSON.stringify(mockQRCodeData1)
};

// Test 2: QR code with no washes left
const testNoWashesLeft = {
    qrCodeData: JSON.stringify({
        ...mockQRCodeData1,
        washesLeft: 0
    })
};

// Test 3: Invalid QR code format
const testInvalidQRCode = {
    qrCodeData: JSON.stringify({
        userId: "invalid",
        type: "invalid_type"
    })
};

// Test 4: Missing required fields
const testMissingFields = {
    qrCodeData: JSON.stringify({
        userId: "507f1f77bcf86cd799439011"
        // Missing other required fields
    })
};

// ========================================
// COMPLETE TEST EXAMPLE
// ========================================

const completeTestExample = async () => {
    console.log('=== Testing QR Code Scan Endpoint ===\n');

    // Test 1: Valid QR code
    console.log('Test 1: Valid QR code with 5 washes');
    console.log('Request Body:', JSON.stringify(testValidQRCode, null, 2));
    console.log('Expected: Success - wash decremented to 4\n');

    // Test 2: No washes left
    console.log('Test 2: QR code with 0 washes');
    console.log('Request Body:', JSON.stringify(testNoWashesLeft, null, 2));
    console.log('Expected: Error - no washes left\n');

    // Test 3: Invalid format
    console.log('Test 3: Invalid QR code format');
    console.log('Request Body:', JSON.stringify(testInvalidQRCode, null, 2));
    console.log('Expected: Error - invalid QR code format\n');
};

// Export for use in other files
module.exports = {
    mockQRCodeData1,
    mockQRCodeData2,
    mockQRCodeData3,
    testValidQRCode,
    testNoWashesLeft,
    testInvalidQRCode,
    testMissingFields,
    completeTestExample,
    curlCommand1,
    curlCommand2
};

// Run example if this file is executed directly
if (require.main === module) {
    completeTestExample();

    console.log('=== Mock Data Examples ===');
    console.log('\nExample 1 (5 washes):');
    console.log(JSON.stringify(mockQRCodeData1, null, 2));

    console.log('\nExample 2 (1 wash):');
    console.log(JSON.stringify(mockQRCodeData2, null, 2));

    console.log('\nExample 3 (10 washes):');
    console.log(JSON.stringify(mockQRCodeData3, null, 2));
}
