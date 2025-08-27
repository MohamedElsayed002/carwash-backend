// Notification service utility
// Integrate with SMS/email/push providers as needed
const Notification = require('../modules/notification/notification.model');
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE;
let twilioClient = null;

// Only initialize Twilio if valid credentials are provided
if (accountSid && authToken && accountSid.startsWith('AC') && authToken.length > 0) {
  try {
    twilioClient = twilio(accountSid, authToken);
    console.log('✅ Twilio client initialized successfully');
  } catch (error) {
    console.warn('⚠️ Failed to initialize Twilio client:', error.message);
    twilioClient = null;
  }
} else {
  console.log('ℹ️ Twilio credentials not provided, SMS notifications will be disabled');
}

async function sendSMS(to, message) {
  if (!twilioClient) {
    console.log(`📱 SMS would be sent to ${to}: ${message} (Twilio not configured)`);
    return { success: false, message: 'Twilio not configured' };
  }
  
  try {
    return await twilioClient.messages.create({
      body: message,
      from: twilioPhone,
      to,
    });
  } catch (error) {
    console.error('❌ Failed to send SMS:', error.message);
    return { success: false, error: error.message };
  }
}

async function sendNotification({ user, type, message, relatedWash, relatedPayment, relatedPackage, phone, title }) {
  // For now, just log the notification
  console.log(`Send notification to user ${user}: [${type}] ${message}`);
  // Save to Notification model
  await Notification.create({
    user,
    type,
    message,
    title: title || message.substring(0, 50), // Use first 50 chars as title if not provided
    relatedWash,
    relatedPayment,
    relatedPackage
  });
  // Send SMS for OTP or important notifications
  if (type === 'otp' && phone) {
    try {
      const smsResult = await sendSMS(phone, message);
      if (smsResult.success === false) {
        console.log('ℹ️ SMS not sent:', smsResult.message);
      }
    } catch (err) {
      console.error('❌ Failed to send SMS:', err.message);
    }
  }
}

module.exports = { sendNotification, sendSMS }; 