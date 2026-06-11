const mongoose = require('mongoose');

// Time slots: 8-10, 10-12, 12-2, 14-4 (in 24h)
// "08:00-10:00", "10:00-12:00", "12:00-14:00", "14:00-16:00"

const bookingSchema = new mongoose.Schema({
  lab: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true },
  lecturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentBatch: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentBatch', required: true },
  date: { type: Date, required: true },
  timeSlot: {
    type: String,
    enum: ['08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00'],
    required: true
  },
  purpose: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: { type: String },
  handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // lab assistant who approved/rejected
  handledAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// Prevent double-booking same lab + date + timeslot
bookingSchema.index({ lab: 1, date: 1, timeSlot: 1 }, { unique: true, partialFilterExpression: { status: { $ne: 'rejected' } } });

module.exports = mongoose.model('Booking', bookingSchema);
