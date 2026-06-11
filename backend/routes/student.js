const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const StudentBatch = require('../models/StudentBatch');
const { protect, requireRole } = require('../middleware/auth');

// GET student's lab sessions (find bookings for batches they're in)
router.get('/sessions', protect, requireRole('student'), async (req, res) => {
  try {
    const batches = await StudentBatch.find({ students: req.user._id });
    const batchIds = batches.map(b => b._id);

    const bookings = await Booking.find({
      studentBatch: { $in: batchIds },
      status: 'approved'
    })
      .populate('lab', 'name location capacity')
      .populate('lecturer', 'name email')
      .populate('studentBatch', 'name academicYear focusArea')
      .sort({ date: 1 });

    res.json(bookings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET student's batches
router.get('/batches', protect, requireRole('student'), async (req, res) => {
  try {
    const batches = await StudentBatch.find({ students: req.user._id });
    res.json(batches);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
