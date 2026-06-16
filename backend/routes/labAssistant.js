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


// GET /api/assistant/schedule?date=2024-01-15
router.get('/schedule', ...assistantAccess, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const start = new Date(targetDate); start.setHours(0,0,0,0);
    const end   = new Date(targetDate); end.setHours(23,59,59,999);

    // Only show labs assigned to this assistant
    const myLabs = await Lab.find({ assignedAssistants: req.user._id });
    const labIds = myLabs.map(l => l._id);

    const bookings = await Booking.find({
      lab: { $in: labIds },
      date: { $gte: start, $lte: end }
    })
      .populate('lab', 'name location capacity')
      .populate('lecturer', 'name email')
      .populate('studentBatch', 'name academicYear focusArea')
      .sort({ timeSlot: 1 });

    res.json({ bookings, labs: myLabs });
  } catch (err) { res.status(500).json({ message: err.message }); }
});


// GET /api/assistant/schedule/semester/:id
router.get('/schedule/semester/:id', ...assistantAccess, async (req, res) => {
  try {
    const Semester = require('../models/Semester');
    const semester = await Semester.findById(req.params.id);
    if (!semester) return res.status(404).json({ message: 'Semester not found' });

    const myLabs = await Lab.find({ assignedAssistants: req.user._id });
    const labIds = myLabs.map(l => l._id);

    const bookings = await Booking.find({
      lab: { $in: labIds },
      date: { $gte: semester.startDate, $lte: semester.endDate }
    })
      .populate('lab', 'name location capacity')
      .populate('lecturer', 'name email')
      .populate('studentBatch', 'name academicYear focusArea')
      .sort({ date: 1, timeSlot: 1 });

    res.json({ bookings, labs: myLabs, semester });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;

// ── DIRECT LAB ASSIGNMENT (Lab Assistant) ─────────────────────────────────────
// Lab assistant assigns a lab directly for labs they manage

router.post('/assign-lab', ...assistantAccess, async (req, res) => {
  try {
    const Lab = require('../models/Lab');
    const Booking = require('../models/Booking');
    const { lab, lecturer, studentBatch, date, timeSlot, purpose } = req.body;
    if (!lab || !lecturer || !studentBatch || !date || !timeSlot)
      return res.status(400).json({ message: 'Lab, lecturer, batch, date and time slot are required' });

    // Verify assistant is assigned to this lab
    const labDoc = await Lab.findById(lab);
    const isAssigned = labDoc?.assignedAssistants?.some(a => a.toString() === req.user._id.toString());
    if (!isAssigned) return res.status(403).json({ message: 'You are not assigned to this lab' });

    const d = new Date(date); d.setHours(0,0,0,0);
    const dEnd = new Date(date); dEnd.setHours(23,59,59,999);
    const conflict = await Booking.findOne({ lab, timeSlot, status: { $ne: 'rejected' }, date: { $gte: d, $lte: dEnd } });
    if (conflict) return res.status(400).json({ message: 'That time slot is already booked' });

    const booking = await Booking.create({
      lab, lecturer, studentBatch,
      date: new Date(date), timeSlot,
      purpose: purpose || '',
      status: 'approved',
      handledBy: req.user._id,
      handledAt: new Date(),
    });

    await booking.populate([
      { path: 'lab', select: 'name location' },
      { path: 'lecturer', select: 'name email' },
      { path: 'studentBatch', select: 'name focusArea' },
    ]);
    res.status(201).json({ message: 'Lab session assigned', booking });
  } catch (err) {
    console.error('POST /assistant/assign-lab:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.post('/assign-lab/semester', ...assistantAccess, async (req, res) => {
  try {
    const Lab = require('../models/Lab');
    const Booking = require('../models/Booking');
    const Semester = require('../models/Semester');
    const { lab, lecturer, studentBatch, timeSlot, purpose, semesterId, dayOfWeek, selectedDates } = req.body;
    if (!lab || !lecturer || !studentBatch || !timeSlot)
      return res.status(400).json({ message: 'Lab, lecturer, batch and time slot are required' });

    const labDoc = await Lab.findById(lab);
    const isAssigned = labDoc?.assignedAssistants?.some(a => a.toString() === req.user._id.toString());
    if (!isAssigned) return res.status(403).json({ message: 'You are not assigned to this lab' });

    let dates = [];
    if (selectedDates && selectedDates.length > 0) {
      dates = selectedDates.map(d => new Date(d + 'T12:00:00'));
    } else if (semesterId && dayOfWeek !== undefined && dayOfWeek !== '') {
      const semester = await Semester.findById(semesterId);
      if (!semester) return res.status(404).json({ message: 'Semester not found' });
      const day = parseInt(dayOfWeek);
      const cur = new Date(semester.startDate); cur.setHours(12,0,0,0);
      const end = new Date(semester.endDate); end.setHours(23,59,59,999);
      while (cur.getDay() !== day) cur.setDate(cur.getDate() + 1);
      while (cur <= end) { dates.push(new Date(cur)); cur.setDate(cur.getDate() + 7); }
    } else {
      return res.status(400).json({ message: 'Provide semester + day of week, or specific dates' });
    }

    if (dates.length === 0) return res.status(400).json({ message: 'No valid dates found' });

    const conflicts = [];
    for (const date of dates) {
      const d = new Date(date); d.setHours(0,0,0,0);
      const dEnd = new Date(date); dEnd.setHours(23,59,59,999);
      const conflict = await Booking.findOne({ lab, timeSlot, status: { $ne: 'rejected' }, date: { $gte: d, $lte: dEnd } });
      if (conflict) conflicts.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    if (conflicts.length > 0)
      return res.status(400).json({ message: `Conflicts on: ${conflicts.join(', ')}`, conflicts });

    const bookings = await Booking.insertMany(dates.map(date => ({
      lab, lecturer, studentBatch, date, timeSlot,
      purpose: purpose || '',
      status: 'approved',
      handledBy: req.user._id,
      handledAt: new Date(),
    })));

    res.status(201).json({ message: `${bookings.length} session${bookings.length !== 1 ? 's' : ''} assigned`, count: bookings.length });
  } catch (err) {
    console.error('POST /assistant/assign-lab/semester:', err.message);
    res.status(500).json({ message: err.message });
  }
});
