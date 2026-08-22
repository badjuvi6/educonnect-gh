const asyncHandler = require('express-async-handler');
const Process = require('../models/Process');
const FeeStatus = require('../models/FeeStatus');

/**
 * @desc    Create a new academic process request
 * @route   POST /api/process
 * @access  Private (student)
 */
const createProcess = asyncHandler(async (req, res) => {
  const { type, academicYear, semester, description } = req.body;

  if (!type || !academicYear || !semester) {
    res.status(400);
    throw new Error('Please provide process type, academic year and semester');
  }

  const process = await Process.create({
    student: req.user._id,
    type,
    academicYear,
    semester,
    description: description || '',
  });

  res.status(201).json({ success: true, data: process });
});

/**
 * @desc    Get processes - a student sees only their own, staff sees all (with filters)
 * @route   GET /api/process
 * @access  Private
 */
const getProcesses = asyncHandler(async (req, res) => {
  const { status, type, studentId, page = 1, limit = 20 } = req.query;

  const filter = {};

  if (req.user.role === 'student') {
    filter.student = req.user._id;
  } else if (studentId) {
    filter.student = studentId;
  }

  if (status) filter.status = status;
  if (type) filter.type = type;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [processes, total] = await Promise.all([
    Process.find(filter)
      .populate('student', 'name indexNumber program level department')
      .populate('handledBy', 'name role')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Process.countDocuments(filter),
  ]);

  res.json({
    success: true,
    count: processes.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: processes,
  });
});

/**
 * @desc    Get a single process by id
 * @route   GET /api/process/:id
 * @access  Private
 */
const getProcessById = asyncHandler(async (req, res) => {
  const process = await Process.findById(req.params.id)
    .populate('student', 'name indexNumber program level department')
    .populate('handledBy', 'name role');

  if (!process) {
    res.status(404);
    throw new Error('Process request not found');
  }

  const isOwner = process.student._id.toString() === req.user._id.toString();
  const isStaff = req.user.role === 'lecturer' || req.user.role === 'admin';

  if (!isOwner && !isStaff) {
    res.status(403);
    throw new Error('You are not authorized to view this record');
  }

  res.json({ success: true, data: process });
});

/**
 * @desc    Update process status (approve/reject/review) - staff only
 * @route   PUT /api/process/:id
 * @access  Private (lecturer, admin)
 */
const updateProcessStatus = asyncHandler(async (req, res) => {
  const { status, remarks } = req.body;

  const process = await Process.findById(req.params.id);

  if (!process) {
    res.status(404);
    throw new Error('Process request not found');
  }

  if (status) {
    if (!['Pending', 'In Review', 'Approved', 'Rejected'].includes(status)) {
      res.status(400);
      throw new Error('Invalid status value');
    }
    process.status = status;
    if (status === 'Approved' || status === 'Rejected') {
      process.resolvedAt = new Date();
    }
  }

  if (remarks !== undefined) process.remarks = remarks;
  process.handledBy = req.user._id;

  const updated = await process.save();
  const populated = await updated.populate([
    { path: 'student', select: 'name indexNumber program level department' },
    { path: 'handledBy', select: 'name role' },
  ]);

  res.json({ success: true, data: populated });
});

/**
 * @desc    Delete a pending process request (student can withdraw their own)
 * @route   DELETE /api/process/:id
 * @access  Private
 */
const deleteProcess = asyncHandler(async (req, res) => {
  const process = await Process.findById(req.params.id);

  if (!process) {
    res.status(404);
    throw new Error('Process request not found');
  }

  const isOwner = process.student.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    res.status(403);
    throw new Error('You are not authorized to delete this record');
  }

  if (isOwner && process.status !== 'Pending' && !isAdmin) {
    res.status(400);
    throw new Error('Only pending requests can be withdrawn');
  }

  await process.deleteOne();

  res.json({ success: true, message: 'Process request removed' });
});

/**
 * @desc    Get a summary of fee status + process counts for the logged-in student's dashboard
 * @route   GET /api/process/dashboard-summary
 * @access  Private (student)
 */
const getStudentSummary = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  const [processes, feeRecords] = await Promise.all([
    Process.find({ student: studentId }).sort({ createdAt: -1 }).limit(5),
    FeeStatus.find({ student: studentId }).sort({ createdAt: -1 }),
  ]);

  const statusCounts = await Process.aggregate([
    { $match: { student: studentId } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const counts = { Pending: 0, 'In Review': 0, Approved: 0, Rejected: 0 };
  statusCounts.forEach((s) => {
    counts[s._id] = s.count;
  });

  res.json({
    success: true,
    data: {
      recentProcesses: processes,
      statusCounts: counts,
      feeRecords,
    },
  });
});

module.exports = {
  createProcess,
  getProcesses,
  getProcessById,
  updateProcessStatus,
  deleteProcess,
  getStudentSummary,
};
