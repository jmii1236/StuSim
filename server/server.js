const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcrypt');
const { createClient } = require('@deepgram/sdk');

const connectDB = require('./config/db');
const User = require('./models/user');
const Session = require('./models/session');
const Turn = require('./models/turn');

const usersRouter = require('./routes/users');
const sessionsRouter = require('./routes/sessions');
const turnsRouter = require('./routes/turns');

const app = express();
const upload = multer();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Deepgram setup
const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
if (!deepgramApiKey) throw new Error('Missing DEEPGRAM_API_KEY');
const deepgramClient = createClient(deepgramApiKey);

// -------------------------
// Health checks
// -------------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running!', timestamp: new Date() });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// -------------------------
// Routers
// -------------------------
app.use('/api/users', usersRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/turns', turnsRouter);

// -------------------------
// Transcribe route
// (stays here since it uses multer + deepgram directly)
// -------------------------
app.post('/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file provided' });

  const { buffer, mimetype } = req.file;
  const { userId, sessionId, turnIndex, speaker } = req.body;

  try {
    const { result, error } = await deepgramClient.listen.prerecorded.transcribeFile(buffer, {
      mimetype,
      model: 'nova-2',
      language: 'en-US',
      smart_format: true,
    });

    if (error) throw new Error(error.message);

    const transcriptText = result.results.channels[0].alternatives[0].transcript;
    const duration = result.metadata?.duration || 0;

    // Save as a Turn if we have session context
    if (userId && sessionId && userId !== 'undefined' && sessionId !== 'undefined') {
      const turn = new Turn({
        sessionId,
        userId,
        index: parseInt(turnIndex) || 0,
        speaker: speaker || 'tutor',
        text: transcriptText,
        timestampMs: Date.now(),
        durationSeconds: duration,
      });
      await turn.save();

      return res.json({
        transcript: transcriptText,
        turnId: turn._id,
        duration,
      });
    }

    // No session context, just return transcript
    console.warn('Transcribe called without valid userId/sessionId — skipping DB save');
    return res.json({ transcript: transcriptText, duration });

  } catch (err) {
    console.error('Transcription error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});