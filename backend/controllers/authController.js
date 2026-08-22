const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Register a new user (student or staff)
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, indexNumber, program, department, level, phone } = req.body;

  // Public self-registration is intentionally student-only. Lecturer and admin
  // accounts are provisioned by an existing admin via POST /api/users, or by
  // the one-time seeder script, so that dashboard access can't be self-granted.
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email and password');
  }

  if (!indexNumber) {
    res.status(400);
    throw new Error('Please provide your student index number');
  }

  const userExists = await User.findOne({ email: email.toLowerCase() });
  if (userExists) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  const indexExists = await User.findOne({ indexNumber });
  if (indexExists) {
    res.status(400);
    throw new Error('An account with this index number already exists');
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: 'student',
    indexNumber,
    program: program || '',
    department: department || '',
    level: level || 'N/A',
    phone: phone || '',
  });

  if (user) {
    res.status(201).json({
      success: true,
      data: user.toSafeObject(),
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data provided');
  }
});

/**
 * @desc    Authenticate user & return token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide both email and password');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('This account has been deactivated. Contact an administrator.');
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    data: user.toSafeObject(),
    token: generateToken(user._id),
  });
});

/**
 * @desc    Get the currently authenticated user's profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({ success: true, data: user.toSafeObject() });
});

/**
 * @desc    Update own profile (name, phone, program, department)
 * @route   PUT /api/auth/me
 * @access  Private
 */
const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const updatableFields = ['name', 'phone', 'program', 'department'];
  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  });

  const updatedUser = await user.save();

  res.json({ success: true, data: updatedUser.toSafeObject() });
});

/**
 * @desc    Change own password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Please provide the current and new password');
  }

  const user = await User.findById(req.user._id).select('+password');

  if (!user || !(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password updated successfully' });
});

module.exports = { registerUser, loginUser, getMe, updateMe, changePassword };
