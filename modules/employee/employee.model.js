const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WashingPlace',
    required: true
  },
  position: {
    type: String,
    required: true,
    default: 'غاسل سيارات'
  },
  salary: {
    type: Number,
    required: true,
    default: 3000
  },
  hireDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  skills: [{
    type: String
  }],
  schedule: {
    monday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    tuesday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    wednesday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    thursday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    friday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    saturday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    sunday: { start: String, end: String, isWorking: { type: Boolean, default: false } }
  }
}, {
  timestamps: true
});

// Indexes
employeeSchema.index({ userId: 1 });
employeeSchema.index({ branchId: 1 });
employeeSchema.index({ isActive: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
