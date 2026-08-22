const mongoose = require('mongoose');

const courseMaterialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title for the resource'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    courseCode: {
      type: String,
      required: [true, 'Please provide a course code, e.g. CSM 261'],
      trim: true,
      uppercase: true,
    },
    courseName: {
      type: String,
      required: [true, 'Please provide the course name'],
      trim: true,
    },
    // Materials are stored as external links (e.g. Google Drive, OneDrive) to keep
    // the backend stateless and avoid needing binary file storage infrastructure.
    resourceUrl: {
      type: String,
      required: [true, 'Please provide a link to the resource'],
      trim: true,
    },
    resourceType: {
      type: String,
      enum: ['Lecture Slides', 'Past Questions', 'Handout', 'Video', 'Reading List', 'Other'],
      default: 'Other',
    },
    department: {
      type: String,
      trim: true,
      required: true,
    },
    level: {
      type: String,
      enum: ['100', '200', '300', '400', '500', 'All'],
      default: 'All',
    },
    semester: {
      type: String,
      enum: ['Semester 1', 'Semester 2', 'Trimester 1', 'Trimester 2', 'Trimester 3'],
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

courseMaterialSchema.index({ department: 1, level: 1, createdAt: -1 });

module.exports = mongoose.model('CourseMaterial', courseMaterialSchema);
