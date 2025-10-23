const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  taType: {
    type: String,
    enum: ['undergraduate', 'graduate', 'professional'],
  },
  experience: {
    type: String,
    enum: ['0-6', '6-12', '1-2', '2+'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);