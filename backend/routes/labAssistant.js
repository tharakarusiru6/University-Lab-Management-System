const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Lab = require('../models/Lab');
const { protect, requireRole, requireApproved } = require('../middleware/auth');

const assistantAccess = [protect, requireRole('lab_assistant'), requireApproved];

// GET pending bookings for labs this assistant manages
router.get('/bookings', ...assistantAccess, async (req, res) => {
  try {
    const { status } = req.query;

    // Find labs assigned to this assistant
    const labs = await Lab.find({ assignedAssistants: req.user._id });
    const labIds = labs.map(l => l._id);

    const filter = { lab: { $in: labIds } };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('lab', 'name location')
      .populate('lecturer', 'name email')
      .populate('studentBatch', 'name academicYear focusArea students')
      .populate('handledBy', 'name')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET my labs
router.get('/my-labs', ...assistantAccess, async (req, res) => {
  try {
    const labs = await Lab.find({ assignedAssistants: req.user._id }).populate('assignedAssistants', 'name email');
    res.json(labs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH approve/reject booking
router.patch('/bookings/:id', ...assistantAccess, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await Booking.findById(req.params.id).populate('lab');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Verify assistant is assigned to this lab
    const lab = await Lab.findOne({ _id: booking.lab._id, assignedAssistants: req.user._id });
    if (!lab) return res.status(403).json({ message: 'Not assigned to this lab' });

    booking.status = status;
    booking.handledBy = req.user._id;
    booking.handledAt = new Date();
    if (status === 'rejected' && rejectionReason) booking.rejectionReason = rejectionReason;
    await booking.save();

    await booking.populate([
      { path: 'lab', select: 'name location' },
      { path: 'lecturer', select: 'name email' },
      { path: 'studentBatch', select: 'name academicYear focusArea' }
    ]);

    res.json(booking);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
