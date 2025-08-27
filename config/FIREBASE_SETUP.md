# Firebase Setup Guide

## 🔒 **Security Notice**
**Never commit actual Firebase credentials to version control!**

## 📋 **Setup Steps**

### **1. Get Firebase Credentials**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Download the JSON file

### **2. Configure Firebase**
1. Rename the downloaded file to `firebase-credentials.json`
2. Place it in the `config/` folder
3. Update your `.env` file with the path:
   ```
   FIREBASE_CREDENTIALS_PATH=./config/firebase-credentials.json
   ```

### **3. Environment Variables**
Add these to your `.env` file:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CREDENTIALS_PATH=./config/firebase-credentials.json
```

### **4. Update Firebase Config**
In `config/firebase.js`, use environment variables:
```javascript
const admin = require('firebase-admin');

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  // ... other fields
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
```

## 🚨 **Important Security Notes**
- ✅ Use environment variables for credentials
- ✅ Add credential files to `.gitignore`
- ✅ Use GitHub Secrets for deployment
- ❌ Never commit actual credentials
- ❌ Never share credential files

## 🔧 **For Development**
1. Copy `firebase-template.json` to `firebase-credentials.json`
2. Fill in your actual credentials
3. The file will be ignored by Git

## 🚀 **For Production**
Use environment variables or secure credential management systems.
