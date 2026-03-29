const User = require('../models/User');
const jwt = require('jsonwebtoken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // 2. STRICTURE: Allow only ONE admin in the system
    if (role === 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'An administrator account already exists. Only one admin is allowed.' 
            });
        }
    }

    // 2. Create user (password will be hashed by pre-save middleware)
    const user = await User.create({
      name,
      email,
      password,
      role
    });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(`[Register Failed] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await User.findOne({ email });

    // 2. Check if user exists and password matches
    if (user && (await user.matchPassword(password))) {
      
      // STRICTURE: If role is admin, only the first-ever registered admin is allowed
      if (user.role === 'admin') {
          const firstAdmin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
          if (firstAdmin && firstAdmin._id.toString() !== user._id.toString()) {
              return res.status(401).json({ 
                  success: false, 
                  message: 'This administrator account is unauthorized. Only the primary administrator is allowed access.' 
              });
          }
      }

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '3h' }
      );

      res.status(200).json({
        success: true,
        token,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(`[Login Failed] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = { registerUser, loginUser };
