const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ['Mobile Money', 'Bank Transfer', 'Cash', 'Card', 'Other'],
      default: 'Mobile Money',
    },
    reference: { type: String, trim: true, default: '' },
    paidAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const feeStatusSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
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
    totalFees: {
      type: Number,
      required: true,
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'GHS',
    },
    dueDate: {
      type: Date,
    },
    paymentHistory: [paymentSchema],
  },
  { timestamps: true }
);

// Virtual balance and status, computed on the fly rather than stored to avoid drift
feeStatusSchema.virtual('balance').get(function () {
  return Math.max(this.totalFees - this.amountPaid, 0);
});

feeStatusSchema.virtual('status').get(function () {
  if (this.amountPaid >= this.totalFees) return 'Paid';
  if (this.amountPaid > 0) return 'Partial';
  return 'Owing';
});

feeStatusSchema.set('toJSON', { virtuals: true });
feeStatusSchema.set('toObject', { virtuals: true });

feeStatusSchema.index({ student: 1, academicYear: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('FeeStatus', feeStatusSchema);
