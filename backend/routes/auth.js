const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, academicYear, focusArea, registerNumber } = req.body;

    if (!['lecturer', 'lab_assistant', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role for registration' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    if (role === 'student') {
      if (!academicYear || !focusArea || !registerNumber) {
        return res.status(400).json({ message: 'Students need academic year, focus area and register number' });
      }
      const existingReg = await User.findOne({ registerNumber });
      if (existingReg) return res.status(400).json({ message: 'Register number already in use' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      academicYear: role === 'student' ? academicYear : undefined,
      focusArea: role === 'student' ? focusArea : undefined,
      registerNumber: role === 'student' ? registerNumber : undefined,
      // Students are auto-approved; staff need admin approval
      isApproved: role === 'student' ? true : false,
    });

    res.status(201).json({
      message: role === 'student'
        ? 'Registration successful'
        : 'Registration submitted. Await admin approval.',
      user: user.toSafeObject()
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.isActive) return res.status(403).json({ message: 'Account deactivated' });

    if (user.role !== 'admin' && user.role !== 'student' && !user.isApproved) {
      return res.status(403).json({ message: 'Account pending admin approval' });
    }

    const token = signToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

// PATCH /api/auth/change-password
router.patch('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const valid = await user.comparePassword(currentPassword);
    if (!valid) return res.status(400).json({ message: 'Current password incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
