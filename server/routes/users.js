const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/user');

// GET all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password'); // never expose passwords
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST - Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, taType, experience } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      taType,
      experience,
    });

    const newUser = await user.save();

    // verify user id is created 
    console.log('User created, _id:', user._id);

     res.status(201).json({
      message: 'User created successfully',
      userId: user._id.toString(),
    });
    
    // Don't return the password in the response
    const { password: _, ...userWithoutPassword } = newUser.toObject();
    res.status(201).json(userWithoutPassword);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST - Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('User logged in, _id:', user._id);

    // Return user info (you can add JWT here later)
    res.json({
      message: 'Login successful',
      _id: user._id,
      name: user.name,
      email: user.email,
      taType: user.taType,
      experience: user.experience,
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET single user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;