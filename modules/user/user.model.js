const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true },
  role: { type: String, enum: ['owner', 'user', 'admin'], default: 'user' },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notification' }],
  isPaid: { type: Boolean, default: false }, // Payment status flag
  package: {
    _id: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String },
    basePrice: { type: Number },
    originalPrice: { type: Number },
    features: [{ type: String }],
    popular: { type: Boolean, default: false },
    washes: { type: Number },
    savings: { type: Number },
    duration: { type: Number },
    size: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
    paidWashes: { type: Number },
    freeWashes: { type: Number }
  },
  otp: { type: String },
  otpExpires: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  lastLogout: { type: Date },
  notificationSettings: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    pushNotifications: { type: Boolean, default: true },
    orderUpdates: { type: Boolean, default: true },
    paymentUpdates: { type: Boolean, default: true },
    promotionalNotifications: { type: Boolean, default: false },
    feedbackReminders: { type: Boolean, default: true }
  },
  cars: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Car' }],
  qrCode: { type: String }, // Store QR code as base64 data URL
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 