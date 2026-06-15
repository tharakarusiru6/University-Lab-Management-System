const mongoose = require('mongoose');

// One grouped request from lecturer — contains multiple weekly sessions
const recurringBookingSchema = new mongoose.Schema({
  semester:     { type: mongoose.Schema.Types.ObjectId, ref: 'Semester',     required: true },
  lab:          { type: mongoose.Schema.Types.ObjectId, ref: 'Lab',          required: true },
  lecturer:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',         required: true },
  studentBatch: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentBatch', required: true },
  timeSlot:     { type: String, enum: ['08:00-10:00','10:00-12:00','12:00-14:00','14:00-16:00'], required: true },
  purpose:      { type: String, default: '' },

  // All requested session dates
  sessions: [{
    date:   { type: Date, required: true },
    status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
    rejectionReason: { type: String },
  }],

  // Overall request status
  // pending = all sessions pending, partial = some approved/rejected, approved = all approved, rejected = all rejected
  status: { type: String, enum: ['pending','partial','approved','rejected'], default: 'pending' },

  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('RecurringBooking', recurringBookingSchema);
