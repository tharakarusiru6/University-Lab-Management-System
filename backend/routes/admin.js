const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');
const Lab = require('../models/Lab');
const StudentBatch = require('../models/StudentBatch');
const Booking = require('../models/Booking');
const { protect, requireRole } = require('../middleware/auth');

const adminOnly = [protect, requireRole('admin')];

// ─── STATS ────────────────────────────────────────────────────────────────────
router.get('/stats', ...adminOnly, async (req, res) => {
  try {
    const [totalStudents, totalLecturers, totalAssistants, totalLabs, totalBatches, pendingApprovals, pendingBookings, approvedBookings] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'lecturer', isApproved: true }),
      User.countDocuments({ role: 'lab_assistant', isApproved: true }),
      Lab.countDocuments({ isActive: true }),
      StudentBatch.countDocuments(),
      User.countDocuments({ role: { $in: ['lecturer', 'lab_assistant'] }, isApproved: false }),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'approved' }),
    ]);

    const totalUsers = totalStudents + totalLecturers + totalAssistants;

    const recentBookings = await Booking.find()
      .populate('lab', 'name location')
      .populate('lecturer', 'name')
      .populate('studentBatch', 'name')
      .sort({ createdAt: -1 })
      .limit(6);

    res.json({
      totalUsers, totalStudents, totalLecturers, totalAssistants,
      totalLabs, totalBatches,
      pendingApprovals, pendingBookings, approvedBookings,
      recentBookings,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── USER MANAGEMENT ──────────────────────────────────────────────────────────
router.get('/users', ...adminOnly, async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/pending-users', ...adminOnly, async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: ['lecturer', 'lab_assistant'] },
      isApproved: false,
    }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/users/:id/approve', ...adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true, isActive: true },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/users/:id/reject', ...adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: false, isActive: false },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── LAB MANAGEMENT ───────────────────────────────────────────────────────────
router.get('/labs', ...adminOnly, async (req, res) => {
  try {
    const labs = await Lab.find().populate('assignedAssistants', 'name email');
    res.json(labs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/labs', ...adminOnly, async (req, res) => {
  try {
    const lab = await Lab.create(req.body);
    await lab.populate('assignedAssistants', 'name email');
    res.status(201).json(lab);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/labs/:id', ...adminOnly, async (req, res) => {
  try {
    const lab = await Lab.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignedAssistants', 'name email');
    res.json(lab);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/labs/:id', ...adminOnly, async (req, res) => {
  try {
    await Lab.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Lab deactivated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── BATCH MANAGEMENT ─────────────────────────────────────────────────────────
router.get('/batches', ...adminOnly, async (req, res) => {
  try {
    const batches = await StudentBatch.find()
      .populate('students', 'name email registerNumber academicYear focusArea');
    res.json(batches);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/batches', ...adminOnly, async (req, res) => {
  try {
    const { name, academicYear, focusArea } = req.body;

    // Find all students matching this batch criteria
    const matchingStudents = await User.find({
      role: 'student',
      academicYear,
      focusArea,
      isActive: true,
    }).select('_id');

    const studentIds = matchingStudents.map(s => s._id);

    const batch = await StudentBatch.create({
      name,
      academicYear,
      focusArea,
      students: studentIds,
    });

    await batch.populate('students', 'name email registerNumber academicYear focusArea');
    res.status(201).json(batch);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/batches/:id', ...adminOnly, async (req, res) => {
  try {
    const batch = await StudentBatch.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('students', 'name email registerNumber');
    res.json(batch);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/batches/:id', ...adminOnly, async (req, res) => {
  try {
    await StudentBatch.findByIdAndDelete(req.params.id);
    res.json({ message: 'Batch deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Add student manually to a batch
router.post('/batches/:id/add-student', ...adminOnly, async (req, res) => {
  try {
    const { studentId } = req.body;
    const batch = await StudentBatch.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { students: studentId } },
      { new: true }
    ).populate('students', 'name email registerNumber');
    res.json(batch);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Remove student from a batch
router.delete('/batches/:id/remove-student/:studentId', ...adminOnly, async (req, res) => {
  try {
    const batch = await StudentBatch.findByIdAndUpdate(
      req.params.id,
      { $pull: { students: req.params.studentId } },
      { new: true }
    ).populate('students', 'name email registerNumber');
    res.json(batch);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Sync batch — re-scan and add any new matching students
router.post('/batches/:id/sync', ...adminOnly, async (req, res) => {
  try {
    const batch = await StudentBatch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    const matchingStudents = await User.find({
      role: 'student',
      academicYear: batch.academicYear,
      focusArea: batch.focusArea,
      isActive: true,
    }).select('_id');

    const newIds = matchingStudents.map(s => s._id);

    // Add all matching students (addToSet avoids duplicates)
    const updated = await StudentBatch.findByIdAndUpdate(
      batch._id,
      { $addToSet: { students: { $each: newIds } } },
      { new: true }
    ).populate('students', 'name email registerNumber academicYear focusArea');

    res.json({ message: `Synced — ${updated.students.length} students in batch`, batch: updated });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin change password
router.patch('/change-password', ...adminOnly, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.user._id);
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;

// ─── SCHEDULE VIEW ────────────────────────────────────────────────────────────
// GET /api/admin/schedule?date=2024-01-15
router.get('/schedule', ...adminOnly, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const start = new Date(targetDate); start.setHours(0,0,0,0);
    const end   = new Date(targetDate); end.setHours(23,59,59,999);

    const bookings = await Booking.find({ date: { $gte: start, $lte: end } })
      .populate('lab', 'name location capacity')
      .populate('lecturer', 'name email')
      .populate('studentBatch', 'name academicYear focusArea')
      .sort({ 'lab.name': 1, timeSlot: 1 });

    const labs = await Lab.find({ isActive: true }).populate('assignedAssistants', 'name');

    res.json({ bookings, labs });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── DIRECT LAB ASSIGNMENT (Admin) ─────────────────────────────────────────────
// Admin assigns a lab directly — booking created as approved immediately

// Single session
router.post('/assign-lab', ...adminOnly, async (req, res) => {
  try {
    const { lab, lecturer, studentBatch, date, timeSlot, purpose } = req.body;
    if (!lab || !lecturer || !studentBatch || !date || !timeSlot)
      return res.status(400).json({ message: 'Lab, lecturer, batch, date and time slot are required' });

    const d = new Date(date); d.setHours(0,0,0,0);
    const dEnd = new Date(date); dEnd.setHours(23,59,59,999);
    const conflict = await mongoose.model('Booking').findOne({
      lab, timeSlot, status: { $ne: 'rejected' },
      date: { $gte: d, $lte: dEnd },
    });
    if (conflict) return res.status(400).json({ message: 'That time slot is already booked for this lab on that date' });

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
    res.status(201).json({ message: 'Lab session assigned successfully', booking });
  } catch (err) {
    console.error('POST /admin/assign-lab:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Semester / recurring assignment
router.post('/assign-lab/semester', ...adminOnly, async (req, res) => {
  try {
    const { lab, lecturer, studentBatch, timeSlot, purpose, semesterId, dayOfWeek, selectedDates } = req.body;
    if (!lab || !lecturer || !studentBatch || !timeSlot)
      return res.status(400).json({ message: 'Lab, lecturer, batch and time slot are required' });

    let dates = [];
    if (selectedDates && selectedDates.length > 0) {
      dates = selectedDates.map(d => new Date(d + 'T12:00:00'));
    } else if (semesterId && dayOfWeek !== undefined && dayOfWeek !== '') {
      const Semester = require('../models/Semester');
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

    // Check conflicts
    const conflicts = [];
    for (const date of dates) {
      const d = new Date(date); d.setHours(0,0,0,0);
      const dEnd = new Date(date); dEnd.setHours(23,59,59,999);
      const conflict = await Booking.findOne({ lab, timeSlot, status: { $ne: 'rejected' }, date: { $gte: d, $lte: dEnd } });
      if (conflict) conflicts.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    }
    if (conflicts.length > 0)
      return res.status(400).json({
        message: `Conflicts on: ${conflicts.slice(0,5).join(', ')}${conflicts.length > 5 ? ` and ${conflicts.length-5} more` : ''}`,
        conflicts,
      });

    const bookings = await Booking.insertMany(dates.map(date => ({
      lab, lecturer, studentBatch,
      date, timeSlot,
      purpose: purpose || '',
      status: 'approved',
      handledBy: req.user._id,
      handledAt: new Date(),
    })));

    res.status(201).json({ message: `${bookings.length} lab session${bookings.length !== 1 ? 's' : ''} assigned successfully`, count: bookings.length });
  } catch (err) {
    console.error('POST /admin/assign-lab/semester:', err.message);
    res.status(500).json({ message: err.message });
  }
});
