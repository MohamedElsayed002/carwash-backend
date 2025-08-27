const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['homepage', 'services', 'packages', 'about', 'contact', 'faq'], 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  content: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true 
  }, // Can be string, object, or array
  metadata: {
    description: String,
    keywords: [String],
    ogImage: String,
    canonicalUrl: String
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  version: { 
    type: Number, 
    default: 1 
  },
  publishedAt: { 
    type: Date 
  },
  publishedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { 
  timestamps: true 
});

// Index for efficient queries
contentSchema.index({ type: 1, isActive: 1 });
contentSchema.index({ type: 1, version: -1 });

module.exports = mongoose.model('Content', contentSchema);
