const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Lab = require('../models/Lab');
const StudentBatch = require('../models/StudentBatch');
const { protect, requireRole, requireApproved } = require('../middleware/auth');

const lecturerAccess = [protect, requireRole('lecturer'), requireApproved];

// GET all labs
router.get('/labs', ...lecturerAccess, async (req, res) => {
  try {
    const labs = await Lab.find({ isActive: true }).populate('assignedAssistants', 'name email');
    res.json(labs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET all batches
router.get('/batches', ...lecturerAccess, async (req, res) => {
  try {
    const batches = await StudentBatch.find().populate('students', 'name email registerNumber');
    res.json(batches);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET my booking requests
router.get('/bookings', ...lecturerAccess, async (req, res) => {
  try {
    const bookings = await Booking.find({ lecturer: req.user._id })
      .populate('lab', 'name location')
      .populate({ path: 'studentBatch', select: 'name academicYear focusArea students', populate: { path: 'students', select: 'name registerNumber email' } })
      .populate('handledBy', 'name')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create booking request
router.post('/bookings', ...lecturerAccess, async (req, res) => {
  try {
    const { lab, studentBatch, date, timeSlot, purpose } = req.body;

    const conflict = await Booking.findOne({
      lab, date: new Date(date), timeSlot, status: { $ne: 'rejected' }
    });
    if (conflict) return res.status(400).json({ message: 'That lab time slot is already booked' });

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

// PATCH edit a booking (only pending bookings can be edited)
router.patch('/bookings/:id', ...lecturerAccess, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, lecturer: req.user._id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending bookings can be edited' });
    }

    const { lab, studentBatch, date, timeSlot, purpose } = req.body;

    // Check conflict (excluding this booking itself)
    if (lab || date || timeSlot) {
      const conflict = await Booking.findOne({
        _id: { $ne: booking._id },
        lab: lab || booking.lab,
        date: date ? new Date(date) : booking.date,
        timeSlot: timeSlot || booking.timeSlot,
        status: { $ne: 'rejected' }
      });
      if (conflict) return res.status(400).json({ message: 'That lab time slot is already booked' });
    }

    if (lab) booking.lab = lab;
    if (studentBatch) booking.studentBatch = studentBatch;
    if (date) booking.date = new Date(date);
    if (timeSlot) booking.timeSlot = timeSlot;
    if (purpose) booking.purpose = purpose;

    await booking.save();

    await booking.populate([
      { path: 'lab', select: 'name location' },
      { path: 'studentBatch', select: 'name academicYear focusArea' },
    ]);

    res.json(booking);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE cancel a booking (only pending bookings can be cancelled)
router.delete('/bookings/:id', ...lecturerAccess, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, lecturer: req.user._id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status === 'approved') {
      return res.status(400).json({ message: 'Approved bookings cannot be cancelled. Contact the lab assistant.' });
    }
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking cancelled successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET availability for a lab on a date
router.get('/availability', ...lecturerAccess, async (req, res) => {
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
