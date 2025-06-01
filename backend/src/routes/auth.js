const express   = require('express');
const jwt       = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User      = require('../models/User');

const router = express.Router();

/* Helper to generate JWT */
const signToken = id =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

/* ── POST /api/auth/register ── */
router.post('/register', [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 8 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password } = req.body;
  if (await User.exists({ email })) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const user = await User.create({ name, email, password });
  res.status(201).json({ token: signToken(user._id) });
});

/* ── POST /api/auth/login ── */
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({ token: signToken(user._id) });
});

/* ── GET /api/auth/me ── */
const protect = require('../middleware/auth');
router.get('/me', protect, (req, res) => {
  res.json(req.user);
});

module.exports = router;
