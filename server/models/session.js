const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  endedAt: {
    type: Date,
  },
  durationSeconds: {
    type: Number,
  },
  studentParams: {
    csBackground: { 
      type: String 
    },
    personality: { 
      type: String 
    },
    engagementLevel: { 
      type: String 
    },
    issue: { 
      type: String 
    },
    codeToggle: { 
      type: Boolean 
    },
    codeLanguage: { 
      type: String 
    },
    usePersona: { 
      type: String 
    },
  },
  finalCode: {
    type: String,
    default: '',
  },
  evaluationResult: {
    type: mongoose.Schema.Types.Mixed,
  },
});

module.exports = mongoose.model('Session', sessionSchema);