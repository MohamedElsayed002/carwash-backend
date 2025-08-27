const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['otp', 'feedback', 'reminder', 'referral', 'general'], required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['sent', 'delivered', 'read', 'failed'], default: 'sent' },
  relatedWash: { type: mongoose.Schema.Types.ObjectId, ref: 'Wash' },
  relatedFeedback: { type: mongoose.Schema.Types.ObjectId, ref: 'Feedback' },
  sentAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Check if model already exists to prevent compilation error
module.exports = mongoose.models.FeedbackNotification || mongoose.model('FeedbackNotification', notificationSchema); 