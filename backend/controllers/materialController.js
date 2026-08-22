const asyncHandler = require('express-async-handler');
const CourseMaterial = require('../models/CourseMaterial');

/**
 * @desc    Upload/create a new course material entry
 * @route   POST /api/materials
 * @access  Private (lecturer, admin)
 */
const createMaterial = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    courseCode,
    courseName,
    resourceUrl,
    resourceType,
    department,
    level,
    semester,
  } = req.body;

  if (!title || !courseCode || !courseName || !resourceUrl || !department || !semester) {
    res.status(400);
    throw new Error(
      'Please provide title, course code, course name, resource link, department and semester'
    );
  }

  const material = await CourseMaterial.create({
    title,
    description: description || '',
    courseCode,
    courseName,
    resourceUrl,
    resourceType: resourceType || 'Other',
    department,
    level: level || 'All',
    semester,
    uploadedBy: req.user._id,
  });

  const populated = await material.populate('uploadedBy', 'name role');

  res.status(201).json({ success: true, data: populated });
});

/**
 * @desc    Get course materials with optional filters
 * @route   GET /api/materials
 * @access  Private
 */
const getMaterials = asyncHandler(async (req, res) => {
  const { department, level, courseCode, semester, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (department) filter.department = department;
  if (courseCode) filter.courseCode = courseCode.toUpperCase();
  if (semester) filter.semester = semester;
  if (level) filter.level = { $in: [level, 'All'] };

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [materials, total] = await Promise.all([
    CourseMaterial.find(filter)
      .populate('uploadedBy', 'name role')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    CourseMaterial.countDocuments(filter),
  ]);

  res.json({
    success: true,
    count: materials.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: materials,
  });
});

/**
 * @desc    Update a course material entry
 * @route   PUT /api/materials/:id
 * @access  Private (owner or admin)
 */
const updateMaterial = asyncHandler(async (req, res) => {
  const material = await CourseMaterial.findById(req.params.id);

  if (!material) {
    res.status(404);
    throw new Error('Course material not found');
  }

  const isOwner = material.uploadedBy.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('You are not authorized to edit this resource');
  }

  const editableFields = [
    'title',
    'description',
    'courseCode',
    'courseName',
    'resourceUrl',
    'resourceType',
    'department',
    'level',
    'semester',
  ];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) material[field] = req.body[field];
  });

  const updated = await material.save();
  const populated = await updated.populate('uploadedBy', 'name role');

  res.json({ success: true, data: populated });
});

/**
 * @desc    Delete a course material entry
 * @route   DELETE /api/materials/:id
 * @access  Private (owner or admin)
 */
const deleteMaterial = asyncHandler(async (req, res) => {
  const material = await CourseMaterial.findById(req.params.id);

  if (!material) {
    res.status(404);
    throw new Error('Course material not found');
  }

  const isOwner = material.uploadedBy.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('You are not authorized to delete this resource');
  }

  await material.deleteOne();

  res.json({ success: true, message: 'Course material removed' });
});

module.exports = { createMaterial, getMaterials, updateMaterial, deleteMaterial };
