const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@deepgram/sdk');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const upload = multer();

app.use(cors());
app.use(express.json());

const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
if (!deepgramApiKey) throw new Error('Missing DEEPGRAM_API_KEY');

const deepgramClient = createClient(deepgramApiKey);


// Test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running!', timestamp: new Date() });
});

// Add your routes here
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});


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
    
    if(error) throw new Error(err.message);
    const transcript = result.results.channels[0].alternatives[0].transcript;
    return res.json({ transcript });
  } catch (err) {
    console.error("Error with transcribing: ", err);
    res.status(500).json({error: err.message});
  }
})