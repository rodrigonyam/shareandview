const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 5000
  },
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  likeCount: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  category: {
    type: String,
    enum: ['gaming', 'music', 'education', 'entertainment', 'technology', 'sports', 'news', 'other'],
    default: 'other'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isProcessing: {
    type: Boolean,
    default: false
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  quality: {
    type: String,
    enum: ['360p', '720p', '1080p', '1440p', '4k'],
    default: '720p'
  },
  fileSize: {
    type: Number, // in bytes
    default: 0
  },
  uploadProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Update like count when likes array changes
videoSchema.pre('save', function(next) {
  this.likeCount = this.likes.length;
  next();
});

// Index for efficient searching
videoSchema.index({ title: 'text', description: 'text', tags: 'text' });
videoSchema.index({ uploader: 1 });
videoSchema.index({ createdAt: -1 });
videoSchema.index({ views: -1 });

module.exports = mongoose.model('Video', videoSchema);