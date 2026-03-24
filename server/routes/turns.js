const express = require('express');
const router = express.Router();
const Turn = require('../models/turn');

// POST - Save a single turn
router.post('/', async (req, res) => {
  try {
    const { sessionId, userId, index, speaker, text, timestampMs, durationSeconds } = req.body;

    const turn = new Turn({
      sessionId,
      userId,
      index,
      speaker,
      text,
      timestampMs,
      durationSeconds,
    });

    const newTurn = await turn.save();
    res.status(201).json(newTurn);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST - Save multiple turns at once (bulk, useful if saving at session end)
router.post('/bulk', async (req, res) => {
  try {
    const { turns } = req.body; // expects array of turn objects
    const savedTurns = await Turn.insertMany(turns);
    res.status(201).json(savedTurns);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET - All turns for a session (full transcript in order)
router.get('/session/:sessionId', async (req, res) => {
  try {
    const turns = await Turn.find({ sessionId: req.params.sessionId })
                            .sort({ index: 1 });
    res.json(turns);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET - Only tutor turns for a session (useful for evaluation)
router.get('/session/:sessionId/tutor', async (req, res) => {
  try {
    const turns = await Turn.find({ 
      sessionId: req.params.sessionId,
      speaker: 'tutor'
    }).sort({ index: 1 });
    res.json(turns);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET - Only student turns for a session
router.get('/session/:sessionId/student', async (req, res) => {
  try {
    const turns = await Turn.find({ 
      sessionId: req.params.sessionId,
      speaker: 'student'
    }).sort({ index: 1 });
    res.json(turns);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE - All turns for a session (useful for cleanup/testing)
router.delete('/session/:sessionId', async (req, res) => {
  try {
    const result = await Turn.deleteMany({ sessionId: req.params.sessionId });
    res.json({ message: `Deleted ${result.deletedCount} turns` });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;