const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
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

// deegram seutup
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

// Transcribe route
app.post('/transcribe', upload.single('audio'), async (req, res) => {
  if(!req.file) return res.status(400).json({error: "No audio file provided for transcribing"});

  const { buffer, mimetype } = req.file;
  const userId = req.body.userId;

  try {
    const { result, error } = await deepgramClient.listen.prerecorded.transcribeFile(buffer, {
      mimetype,
      model: 'nova-2',
      language: 'en-US',
      smart_format: true,
    });
    
    if(error) throw new Error(error.message);
    const transcriptText = result.results.channels[0].alternatives[0].transcript;

    // Save transcript to database if userId provided
    // fix so transcription files are IN user files, if not it will be too hard to manage
    // also fix so transcriptoin takes in student input too 
    if (userId) {
      const newTranscript = new Transcript({
        userId,
        text: transcriptText,
        duration: result.metadata?.duration || 0,
      });
      await newTranscript.save();
      console.log("Saved transcript for user:", userId);
      
      return res.json({ 
        transcript: transcriptText,
        transcriptId: newTranscript._id 
      });
    }
    
    // If no userId, just return transcript without saving
    return res.json({ transcript: transcriptText });
  } catch (err) {
    console.error("Error with transcribing: ", err);
    res.status(500).json({error: err.message});
  }
});

// Get user transcripts
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
  console.log(`Server running on ${PORT}`);
});