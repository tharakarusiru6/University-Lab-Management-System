const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect, requireRole, requireApproved } = require('../middleware/auth');

const adminOnly    = [protect, requireApproved, requireRole('admin')];
const lecturerOnly = [protect, requireApproved, requireRole('lecturer')];
const assistantOnly = [protect, requireApproved, requireRole('lab_assistant')];

const getSemester        = () => mongoose.model('Semester');
const getRecurringBooking = () => mongoose.model('RecurringBooking');
const getLab             = () => mongoose.model('Lab');

// ── ADMIN: Semester CRUD ───────────────────────────────────────────────────

router.get('/', protect, requireApproved, async (req, res) => {
  try {
    const Semester = getSemester();
    const semesters = await Semester.find()
      .populate('studentBatches', 'name focusArea')
      .populate('createdBy', 'name')
      .sort({ startDate: -1 });
    res.json(semesters);
  } catch (err) {
    console.error('GET /semesters:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.post('/', ...adminOnly, async (req, res) => {
  try {
    const Semester = getSemester();
    const { name, startDate, endDate, studentBatches, description } = req.body;
    if (!name || !startDate || !endDate)
      return res.status(400).json({ message: 'Name, start date and end date are required' });
    if (new Date(endDate) <= new Date(startDate))
      return res.status(400).json({ message: 'End date must be after start date' });

    const semester = await Semester.create({
      name, startDate: new Date(startDate), endDate: new Date(endDate),
      studentBatches: studentBatches || [], description, createdBy: req.user._id,
    });
    await semester.populate('studentBatches', 'name focusArea');
    res.status(201).json(semester);
  } catch (err) {
    console.error('POST /semesters:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id', ...adminOnly, async (req, res) => {
  try {
    const Semester = getSemester();
    const semester = await Semester.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('studentBatches', 'name focusArea');
    if (!semester) return res.status(404).json({ message: 'Semester not found' });
    res.json(semester);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', ...adminOnly, async (req, res) => {
  try {
    const Semester = getSemester();
    const RecurringBooking = getRecurringBooking();
    await RecurringBooking.deleteMany({ semester: req.params.id });
    await Semester.findByIdAndDelete(req.params.id);
    res.json({ message: 'Semester and its bookings deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── LECTURER: Submit grouped recurring booking ─────────────────────────────

router.post('/:id/book', ...lecturerOnly, async (req, res) => {
  try {
    const Semester = getSemester();
    const RecurringBooking = getRecurringBooking();
    const Lab = getLab();

    const { lab, studentBatch, timeSlot, dayOfWeek, purpose, selectedDates } = req.body;
    if (!lab || !studentBatch || !timeSlot)
      return res.status(400).json({ message: 'Lab, student batch and time slot are required' });

    const semester = await Semester.findById(req.params.id);
    if (!semester) return res.status(404).json({ message: 'Semester not found' });

    // Generate dates
    let dates = [];
    if (selectedDates && selectedDates.length > 0) {
      dates = selectedDates.map(d => new Date(d + 'T12:00:00'));
    } else if (dayOfWeek !== undefined && dayOfWeek !== '') {
      const day = parseInt(dayOfWeek);
      const cur = new Date(semester.startDate); cur.setHours(12, 0, 0, 0);
      const end = new Date(semester.endDate);   end.setHours(23, 59, 59, 999);
      while (cur.getDay() !== day) cur.setDate(cur.getDate() + 1);
      while (cur <= end) { dates.push(new Date(cur)); cur.setDate(cur.getDate() + 7); }
    } else {
      return res.status(400).json({ message: 'Provide day of week or specific dates' });
    }

    if (dates.length === 0)
      return res.status(400).json({ message: 'No valid dates found in this semester' });

    // Check for conflicts with existing approved/pending bookings
    const Booking = mongoose.model('Booking');
    const conflicts = [];
    for (const date of dates) {
      const d = new Date(date); d.setHours(0, 0, 0, 0);
      const dEnd = new Date(date); dEnd.setHours(23, 59, 59, 999);
      const conflict = await Booking.findOne({
        lab, timeSlot, status: { $ne: 'rejected' },
        date: { $gte: d, $lte: dEnd },
      });
      if (conflict) conflicts.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    }
    if (conflicts.length > 0)
      return res.status(400).json({
        message: `Conflicts on: ${conflicts.slice(0, 5).join(', ')}${conflicts.length > 5 ? ` and ${conflicts.length - 5} more` : ''}`,
        conflicts,
      });

    // Create ONE grouped recurring booking request
    const recurring = await RecurringBooking.create({
      semester: semester._id,
      lab, lecturer: req.user._id, studentBatch, timeSlot,
      purpose: purpose || '',
      sessions: dates.map(date => ({ date, status: 'pending' })),
      status: 'pending',
    });

    res.status(201).json({
      message: `Recurring booking submitted with ${dates.length} session${dates.length !== 1 ? 's' : ''} — awaiting lab assistant review`,
      count: dates.length,
      booking: recurring,
    });
  } catch (err) {
    console.error('POST /semesters/:id/book:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── LECTURER: Get my recurring bookings ───────────────────────────────────

router.get('/my-recurring', ...lecturerOnly, async (req, res) => {
  try {
    const RecurringBooking = getRecurringBooking();
    const bookings = await RecurringBooking.find({ lecturer: req.user._id })
      .populate('semester', 'name startDate endDate')
      .populate('lab', 'name location')
      .populate('studentBatch', 'name focusArea')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── LAB ASSISTANT: Get recurring requests for my labs ─────────────────────

router.get('/recurring-requests', ...assistantOnly, async (req, res) => {
  try {
    const Lab = getLab();
    const RecurringBooking = getRecurringBooking();
    const myLabs = await Lab.find({ assignedAssistants: req.user._id }).select('_id');
    const labIds = myLabs.map(l => l._id);
    const bookings = await RecurringBooking.find({ lab: { $in: labIds } })
      .populate('semester', 'name startDate endDate')
      .populate('lab', 'name location capacity')
      .populate('lecturer', 'name email')
      .populate('studentBatch', 'name focusArea')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── LAB ASSISTANT: Process recurring booking ──────────────────────────────
// Body: { sessionDecisions: [{ index: 0, status: 'approved'|'rejected', rejectionReason: '' }] }
// Or:   { action: 'approve_all' | 'reject_all', rejectionReason: '' }

router.patch('/recurring-requests/:id/process', ...assistantOnly, async (req, res) => {
  try {
    const RecurringBooking = getRecurringBooking();
    const Booking = mongoose.model('Booking');
    const Lab = getLab();

    const recurring = await RecurringBooking.findById(req.params.id).populate('lab');
    if (!recurring) return res.status(404).json({ message: 'Request not found' });

    // Verify assistant is assigned to this lab
    const isAssigned = recurring.lab.assignedAssistants?.some(
      a => a.toString() === req.user._id.toString()
    );
    if (!isAssigned) return res.status(403).json({ message: 'Not assigned to this lab' });

    const { action, sessionDecisions, rejectionReason } = req.body;

    if (action === 'approve_all') {
      recurring.sessions.forEach(s => { s.status = 'approved'; });
    } else if (action === 'reject_all') {
      recurring.sessions.forEach(s => {
        s.status = 'rejected';
        s.rejectionReason = rejectionReason || 'Rejected by lab assistant';
      });
    } else if (sessionDecisions && Array.isArray(sessionDecisions)) {
      // Partial: per-session decisions
      sessionDecisions.forEach(({ index, status, rejectionReason: reason }) => {
        if (recurring.sessions[index]) {
          recurring.sessions[index].status = status;
          if (reason) recurring.sessions[index].rejectionReason = reason;
        }
      });
    } else {
      return res.status(400).json({ message: 'Provide action or sessionDecisions' });
    }

    // Calculate overall status
    const statuses = recurring.sessions.map(s => s.status);
    const allApproved = statuses.every(s => s === 'approved');
    const allRejected = statuses.every(s => s === 'rejected');
    recurring.status = allApproved ? 'approved' : allRejected ? 'rejected' : 'partial';
    recurring.processedBy = req.user._id;
    recurring.processedAt = new Date();
    await recurring.save();

    // For approved sessions, create individual Booking records so they appear in schedules
    const approvedSessions = recurring.sessions.filter(s => s.status === 'approved');
    for (const session of approvedSessions) {
      const d = new Date(session.date); d.setHours(0, 0, 0, 0);
      const dEnd = new Date(session.date); dEnd.setHours(23, 59, 59, 999);
      const exists = await Booking.findOne({
        lab: recurring.lab._id, timeSlot: recurring.timeSlot,
        date: { $gte: d, $lte: dEnd },
      });
      if (!exists) {
        await Booking.create({
          lab: recurring.lab._id,
          lecturer: recurring.lecturer,
          studentBatch: recurring.studentBatch,
          semester: recurring.semester,
          date: session.date,
          timeSlot: recurring.timeSlot,
          purpose: recurring.purpose,
          status: 'approved',
          handledBy: req.user._id,
          handledAt: new Date(),
        });
      }
    }

    await recurring.populate([
      { path: 'semester', select: 'name' },
      { path: 'lab', select: 'name location' },
      { path: 'lecturer', select: 'name email' },
      { path: 'studentBatch', select: 'name focusArea' },
    ]);

    res.json({ message: `Request ${recurring.status}`, booking: recurring });
  } catch (err) {
    console.error('PATCH recurring-requests/:id/process:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
