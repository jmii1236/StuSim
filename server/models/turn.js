// used for speaking turns in a session
// switches between user (tutor) and student (AI persona) whenever either speak 
// stores text, timestamp, and duration of each turn

const mongoose = require('mongoose');

const turnSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  speaker: {
    type: String,
    enum: ['tutor', 'student'],
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  timestampMs: {
    type: Number,
  },
  durationSeconds: {
    type: Number,   // already saved from Whisper
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Turn', turnSchema);