const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Lab = require('../models/Lab');
const StudentBatch = require('../models/StudentBatch');
const { protect, requireRole, requireApproved } = require('../middleware/auth');

const lecturerAccess = [protect, requireRole('lecturer'), requireApproved];

// GET all labs
router.get('/labs', protect, requireApproved, async (req, res) => {
  try {
    const labs = await Lab.find({ isActive: true }).populate('assignedAssistants', 'name email');
    res.json(labs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET all batches
router.get('/batches', ...lecturerAccess, async (req, res) => {
  try {
    const batches = await StudentBatch.find({ isActive: true }).populate('students', 'name email registerNumber');
    res.json(batches);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET my booking requests
router.get('/bookings', ...lecturerAccess, async (req, res) => {
  try {
    const bookings = await Booking.find({ lecturer: req.user._id })
      .populate('lab', 'name location')
      .populate({ path: 'studentBatch', select: 'name academicYear focusArea students', populate: { path: 'students', select: 'name registrationNumber email' } })
      .populate('handledBy', 'name')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create booking request
router.post('/bookings', ...lecturerAccess, async (req, res) => {
  try {
    const { lab, studentBatch, date, timeSlot, purpose } = req.body;

    // Check for conflicts
    const conflict = await Booking.findOne({ lab, date: new Date(date), timeSlot, status: { $ne: 'rejected' } });
    if (conflict) {
      return res.status(400).json({ message: 'That lab time slot is already booked' });
    }

    const booking = await Booking.create({
      lab, lecturer: req.user._id, studentBatch,
      date: new Date(date), timeSlot, purpose
    });

    await booking.populate([
      { path: 'lab', select: 'name location' },
      { path: 'studentBatch', select: 'name academicYear focusArea' }
    ]);

    res.status(201).json(booking);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'That time slot is already booked' });
    res.status(500).json({ message: err.message });
  }
});

// GET availability for a lab on a date
router.get('/availability', protect, requireApproved, async (req, res) => {
  try {
    const { labId, date } = req.query;
    const bookings = await Booking.find({
      lab: labId,
      date: new Date(date),
      status: { $ne: 'rejected' }
    }).select('timeSlot status');
    res.json(bookings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
