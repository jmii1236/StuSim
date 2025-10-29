const mongoose = require('mongoose');

const transcriptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  messages: [{
    speaker: {
      type: String,
      enum: ['tutor', 'student'],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    timestamp: {
      type: String,
      required: true,
    },
  }],
  duration: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  sessionActive: {
    type: Boolean,
    default: true,
  },
  studentInfo: {
    background: String,
    personality: String,
    difficulty: String,
    issue: String,
  },
});

// Compound index for efficient queries
transcriptSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Transcript', transcriptSchema);