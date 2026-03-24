const express = require('express');
const router = express.Router();
const Session = require('../models/session');
const Turn = require('../models/turn');

// POST - Start a new session
router.post('/start', async (req, res) => {
  try {
    const { userId, studentParams } = req.body;
    // Basic validation
    if (!userId || userId === 'undefined') {
      return res.status(400).json({ message: 'userId is required' });
    }
    const session = new Session({ userId, studentParams });
    const newSession = await session.save();
    res.status(201).json({ sessionId: newSession._id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PATCH - End a session
router.patch('/:id/end', async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      {
        endedAt: new Date(),
        durationSeconds: req.body.durationSeconds,
        finalCode: req.body.finalCode,
      },
      { new: true }
    );
    res.json(session);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET - All sessions for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.params.userId })
                                  .sort({ startedAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET - All turns for a session (full transcript)
router.get('/:id/turns', async (req, res) => {
  try {
    const turns = await Turn.find({ sessionId: req.params.id })
                            .sort({ index: 1 });
    res.json(turns);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;