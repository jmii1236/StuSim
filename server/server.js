const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const { createClient } = require('@deepgram/sdk');
const connectDB = require('./config/db');

dotenv.config();

const app = express();
const upload = multer();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Deepgram
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

// Transcribe route
app.post('/transcribe', upload.single('audio'), async (req, res) => {
  if(!req.file) return res.status(400).json({error: "No audio file provided for transcribing"});

  const { buffer, mimetype } = req.file;

  try {
    const {result, error } = await deepgramClient.listen.prerecorded.transcribeFile(buffer, {
      mimetype,
      model: 'nova-2',
      language: 'en-US',
      smart_format: true,
    });
    
    if(error) throw new Error(error.message);
    const transcript = result.results.channels[0].alternatives[0].transcript;
    return res.json({ transcript });
  } catch (err) {
    console.error("Error with transcribing: ", err);
    res.status(500).json({error: err.message});
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});