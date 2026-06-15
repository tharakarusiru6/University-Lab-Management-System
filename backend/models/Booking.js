const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  lab:          { type: mongoose.Schema.Types.ObjectId, ref: 'Lab',          required: true },
  lecturer:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',         required: true },
  studentBatch: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentBatch', required: true },
  semester:     { type: mongoose.Schema.Types.ObjectId, ref: 'Semester',     default: null },
  date:     { type: Date,   required: true },
  timeSlot: { type: String, enum: ['08:00-10:00','10:00-12:00','12:00-14:00','14:00-16:00'], required: true },
  purpose:  { type: String, default: '' },
  status:   { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  rejectionReason: { type: String },
  handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  handledAt: { type: Date },
}, { timestamps: true });

bookingSchema.index(
  { lab: 1, date: 1, timeSlot: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: 'rejected' } } }
);

module.exports = mongoose.model('Booking', bookingSchema);
