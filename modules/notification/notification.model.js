const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['order', 'payment', 'feedback', 'referral', 'system', 'promotion'], 
    default: 'system' 
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  readAt: { 
    type: Date 
  },
  relatedWash: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Wash' 
  },
  relatedPayment: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Payment' 
  },
  relatedPackage: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'UserPackage' 
  },
  data: { 
    type: mongoose.Schema.Types.Mixed 
  }, // Additional data for the notification
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  expiresAt: { 
    type: Date 
  } // Optional expiry date for notifications
}, { 
  timestamps: true 
});

// Index for efficient queries
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Check if model already exists to prevent compilation error
module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
