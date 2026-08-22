const mongoose = require('mongoose');

const processSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Please specify the process type'],
      enum: [
        'Course Registration',
        'Semester Registration',
        'Exams Registration',
        'Re-sit Registration',
        'Transcript Request',
        'Clearance Form',
        'Industrial Attachment',
        'Change of Program',
        'Hostel Application',
        'Other',
      ],
    },
    academicYear: {
      type: String,
      required: [true, 'Please specify the academic year, e.g. 2025/2026'],
      match: [/^\d{4}\/\d{4}$/, 'Academic year must be in the format 2025/2026'],
    },
    semester: {
      type: String,
      enum: ['Semester 1', 'Semester 2', 'Trimester 1', 'Trimester 2', 'Trimester 3'],
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'In Review', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [1000, 'Remarks cannot exceed 1000 characters'],
      default: '',
    },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

processSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('Process', processSchema);
