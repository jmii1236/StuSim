const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@deepgram/sdk');
const connectDB = require('./config/db');
const Transcript = require('./models/transcript');
const User = require('./models/user');

dotenv.config();

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

// Test routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running!', timestamp: new Date() });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Register route
app.post('/api/users/register', async (req, res) => {
  try {
    const { name, email, password, taType, experience } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = new User({ name, email, password, taType, experience });
    await user.save();

    res.status(201).json({ 
      message: 'User created successfully',
      userId: user._id 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login route
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.json({ 
      message: 'Login successful',
      userId: user._id,
      name: user.name 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/transcripts/start', async (req, res) => {
  try {
    console.log('POST /api/transcripts/start - Body:', req.body);
    
    const { userId, studentParameters } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId is required' 
      });
    }

    // Generate unique session ID
    const sessionId = uuidv4();

    // Create new transcript document
    const transcript = new Transcript({
      userId,
      sessionId,
      messages: [],
      sessionActive: true,
      studentInfo: {
        background: studentParameters?.csBackground || '',
        personality: studentParameters?.personality || '',
        difficulty: studentParameters?.difficulty || '',
        issue: studentParameters?.issue || ''
      }
    });

    await transcript.save();

    console.log('Transcript session created:', sessionId);
    
    res.json({ 
      success: true, 
      sessionId,
      message: 'Transcript session started' 
    });

  } catch (error) {
    console.error('Error starting transcript:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: error.toString()
    });
  }
});

// ADD MESSAGE TO TRANSCRIPT
app.post('/api/transcript/add-message', async (req, res) => {
  try {
    console.log('POST /api/transcript/add-message - Body:', req.body);
    
    const { sessionId, speaker, text, timestamp } = req.body;

    if (!sessionId || !speaker || !text || !timestamp) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields (sessionId, speaker, text, timestamp)' 
      });
    }

    const transcript = await Transcript.findOne({ sessionId, sessionActive: true });

    if (!transcript) {
      return res.status(404).json({ 
        success: false,
        error: 'Active transcript session not found' 
      });
    }

    transcript.messages.push({
      speaker,
      text,
      timestamp
    });

    await transcript.save();

    console.log(`Message added to session ${sessionId} from ${speaker}`);
    
    res.json({ 
      success: true,
      message: 'Message added to transcript' 
    });

  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

app.post('/api/transcript/end', async (req, res) => {
  try {
    console.log('POST /api/transcript/end - Body:', req.body);
    
    const { sessionId, duration } = req.body;

    if (!sessionId) {
      return res.status(400).json({ 
        success: false,
        error: 'sessionId is required' 
      });
    }

    const transcript = await Transcript.findOne({ sessionId });

    if (!transcript) {
      return res.status(404).json({ 
        success: false,
        error: 'Transcript session not found' 
      });
    }

    transcript.sessionActive = false;
    transcript.duration = duration || 0;

    await transcript.save();

    console.log('Transcript session ended:', sessionId);
    
    res.json({ 
      success: true,
      message: 'Transcript session ended',
      totalMessages: transcript.messages.length
    });

  } catch (error) {
    console.error('Error ending transcript:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

app.get('/api/transcripts/sessions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const sessions = await Transcript.find({ userId })
      .sort({ createdAt: -1 })
      .select('sessionId createdAt duration sessionActive studentInfo messages');

    res.json({ 
      success: true,
      sessions,
      count: sessions.length
    });

  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

app.get('/api/transcript/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const transcript = await Transcript.findOne({ sessionId });

    if (!transcript) {
      return res.status(404).json({ 
        success: false,
        error: 'Session not found' 
      });
    }

    res.json({ 
      success: true,
      session: transcript 
    });

  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

app.post('/transcribe', upload.single('audio'), async (req, res) => {
  console.log("TRANSCRIBE ENDPOINT HIT!"); 
  console.log("Request body keys:", Object.keys(req.body));
  console.log("Request file:", req.file ? "FILE EXISTS" : "NO FILE");

  if(!req.file) return res.status(400).json({error: "No audio file provided for transcribing"});

  const { buffer, mimetype } = req.file;

  try {
    const { result, error } = await deepgramClient.listen.prerecorded.transcribeFile(buffer, {
      mimetype,
      model: 'nova-2',
      language: 'en-US',
      smart_format: true,
    });
    
    if(error) throw new Error(error.message);
    const transcriptText = result.results.channels[0].alternatives[0].transcript;

    console.log("Transcription result:", transcriptText);
    console.log("Transcript length:", transcriptText.length);

    if (!transcriptText || transcriptText.trim() === '') {
      console.log("Empty transcription received");
      return res.json({ 
        transcript: '',
        message: 'No speech detected'
      });
    }

    console.log("Valid transcription received:", transcriptText);
    
    // Just return transcript - messages are saved via /api/transcript/add-message
    return res.json({ 
      transcript: transcriptText,
      duration: result.metadata?.duration || 0
    });
    
  } catch (err) {
    console.error("Error with transcribing: ", err);
    res.status(500).json({
      error: err.message,
      details: err.stack
    });
  }
});

// Old route for backward compatibility (if needed elsewhere)
app.get('/api/transcripts/:userId', async (req, res) => {
  try {
    const transcripts = await Transcript.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    
    res.json({ transcripts });
  } catch (error) {
    console.error('Error fetching transcripts:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});