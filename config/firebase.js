const admin = require('firebase-admin');
const path = require('path');

let adminApp = null;

try {
  // Try to load Firebase credentials
  const serviceAccountPath = path.join(__dirname, 'paypass-5c24f-firebase-adminsdk-fbsvc-5b659d2eb8.json');
  
  // Check if file exists
  const fs = require('fs');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin SDK initialized successfully');
  } else {
    console.log('⚠️ Firebase credentials file not found. Firebase features will be disabled.');
    console.log('📝 To enable Firebase, copy your service account JSON to: config/paypass-5c24f-firebase-adminsdk-fbsvc-5b659d2eb8.json');
  }
} catch (error) {
  console.log('⚠️ Firebase initialization failed:', error.message);
  console.log('📝 Firebase features will be disabled. Check your credentials file.');
}

module.exports = adminApp || admin; 