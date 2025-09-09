const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  branchRating: { type: Number, min: 1, max: 5, required: true },
  employeeRating: { type: Number, min: 1, max: 5, required: true },
  ratingComment: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema); 