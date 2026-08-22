const asyncHandler = require('express-async-handler');
const Announcement = require('../models/Announcement');

/**
 * @desc    Create a new announcement
 * @route   POST /api/announcements
 * @access  Private (lecturer, admin)
 */
const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, content, audience, department, priority, expiresAt } = req.body;

  if (!title || !content) {
    res.status(400);
    throw new Error('Please provide a title and content for the announcement');
  }

  const announcement = await Announcement.create({
    title,
    content,
    postedBy: req.user._id,
    audience: audience || 'All',
    department: department || 'All Departments',
    priority: priority || 'Normal',
    expiresAt: expiresAt || null,
  });

  const populated = await announcement.populate('postedBy', 'name role');

  res.status(201).json({ success: true, data: populated });
});

/**
 * @desc    Get announcements, most recent first, excluding expired ones by default
 * @route   GET /api/announcements
 * @access  Private
 */
const getAnnouncements = asyncHandler(async (req, res) => {
  const { audience, includeExpired, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (audience) filter.audience = audience;

  if (includeExpired !== 'true') {
    filter.$or = [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

  const [announcements, total] = await Promise.all([
    Announcement.find(filter)
      .populate('postedBy', 'name role')
      .sort({ priority: -1, createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Announcement.countDocuments(filter),
  ]);

  res.json({
    success: true,
    count: announcements.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: announcements,
  });
});

/**
 * @desc    Get a single announcement
 * @route   GET /api/announcements/:id
 * @access  Private
 */
const getAnnouncementById = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id).populate(
    'postedBy',
    'name role'
  );

  if (!announcement) {
    res.status(404);
    throw new Error('Announcement not found');
  }

  res.json({ success: true, data: announcement });
});

/**
 * @desc    Update an announcement (only the author or an admin)
 * @route   PUT /api/announcements/:id
 * @access  Private (lecturer, admin)
 */
const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    res.status(404);
    throw new Error('Announcement not found');
  }

  const isAuthor = announcement.postedBy.toString() === req.user._id.toString();
  if (!isAuthor && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('You are not authorized to edit this announcement');
  }

  const editableFields = ['title', 'content', 'audience', 'department', 'priority', 'expiresAt'];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) announcement[field] = req.body[field];
  });

  const updated = await announcement.save();
  const populated = await updated.populate('postedBy', 'name role');

  res.json({ success: true, data: populated });
});

/**
 * @desc    Delete an announcement (only the author or an admin)
 * @route   DELETE /api/announcements/:id
 * @access  Private (lecturer, admin)
 */
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    res.status(404);
    throw new Error('Announcement not found');
  }

  const isAuthor = announcement.postedBy.toString() === req.user._id.toString();
  if (!isAuthor && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('You are not authorized to delete this announcement');
  }

  await announcement.deleteOne();

  res.json({ success: true, message: 'Announcement removed' });
});

module.exports = {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
};
