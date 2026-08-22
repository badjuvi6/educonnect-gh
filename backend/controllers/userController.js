const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const FeeStatus = require('../models/FeeStatus');

/**
 * @desc    Create a lecturer or admin account. Kept separate from the public
 *          /api/auth/register endpoint so staff access can only be granted
 *          by an existing administrator.
 * @route   POST /api/users
 * @access  Private (admin)
 */
const createStaffUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, staffId, department, phone } = req.body;

  if (!name || !email || !password || !staffId) {
    res.status(400);
    throw new Error('Please provide name, email, password and staff ID');
  }

  const resolvedRole = ['lecturer', 'admin'].includes(role) ? role : 'lecturer';

  const existing = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { staffId }],
  });
  if (existing) {
    res.status(400);
    throw new Error('An account with this email or staff ID already exists');
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: resolvedRole,
    staffId,
    department: department || '',
    phone: phone || '',
  });

  res.status(201).json({ success: true, data: user.toSafeObject() });
});

/**
 * @desc    List users with optional role/search filters
 * @route   GET /api/users
 * @access  Private (lecturer, admin)
 */
const getUsers = asyncHandler(async (req, res) => {
  const { role, search, department, level, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (department) filter.department = department;
  if (level) filter.level = level;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { indexNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    count: users.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: users,
  });
});

/**
 * @desc    Get a single student/staff record by id
 * @route   GET /api/users/:id
 * @access  Private (lecturer, admin)
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const feeRecords =
    user.role === 'student' ? await FeeStatus.find({ student: user._id }).sort({ createdAt: -1 }) : [];

  res.json({ success: true, data: { ...user.toSafeObject(), feeRecords } });
});

/**
 * @desc    Update a user's record (admin only) - e.g. department, level, activate/deactivate
 * @route   PUT /api/users/:id
 * @access  Private (admin)
 */
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const editableFields = [
    'name',
    'program',
    'department',
    'level',
    'phone',
    'isActive',
    'role',
  ];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) user[field] = req.body[field];
  });

  const updated = await user.save();

  res.json({ success: true, data: updated.toSafeObject() });
});

/**
 * @desc    Delete a user record
 * @route   DELETE /api/users/:id
 * @access  Private (admin)
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot delete your own account from this endpoint');
  }

  await user.deleteOne();

  res.json({ success: true, message: 'User removed' });
});

/**
 * @desc    Create or update a fee status record for a student
 * @route   POST /api/users/:id/fees
 * @access  Private (admin)
 */
const upsertFeeStatus = asyncHandler(async (req, res) => {
  const { academicYear, semester, totalFees, dueDate } = req.body;

  const student = await User.findById(req.params.id);
  if (!student || student.role !== 'student') {
    res.status(404);
    throw new Error('Student not found');
  }

  if (!academicYear || !semester || totalFees === undefined) {
    res.status(400);
    throw new Error('Please provide academic year, semester and total fees');
  }

  const feeRecord = await FeeStatus.findOneAndUpdate(
    { student: student._id, academicYear, semester },
    { $set: { totalFees, dueDate: dueDate || undefined } },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );

  res.status(201).json({ success: true, data: feeRecord });
});

/**
 * @desc    Record a payment against a student's fee status
 * @route   POST /api/users/:id/fees/:feeId/payments
 * @access  Private (admin)
 */
const recordPayment = asyncHandler(async (req, res) => {
  const { amount, method, reference } = req.body;

  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error('Please provide a valid payment amount');
  }

  const feeRecord = await FeeStatus.findOne({
    _id: req.params.feeId,
    student: req.params.id,
  });

  if (!feeRecord) {
    res.status(404);
    throw new Error('Fee record not found');
  }

  feeRecord.paymentHistory.push({
    amount,
    method: method || 'Mobile Money',
    reference: reference || '',
  });
  feeRecord.amountPaid += Number(amount);

  const updated = await feeRecord.save();

  res.json({ success: true, data: updated });
});

module.exports = {
  createStaffUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  upsertFeeStatus,
  recordPayment,
};
