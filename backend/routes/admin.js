const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Lab = require('../models/Lab');
const StudentBatch = require('../models/StudentBatch');
const Booking = require('../models/Booking');
const { protect, requireRole } = require('../middleware/auth');

const adminOnly = [protect, requireRole('admin')];

// ── Users ──────────────────────────────────────────────

// GET pending approvals (lecturers & lab assistants)
router.get('/pending-users', ...adminOnly, async (req, res) => {
  try {
    const users = await User.find({ isApproved: false, role: { $in: ['lecturer', 'lab_assistant'] } });
    res.json(users.map(u => u.toSafeObject()));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET all users
router.get('/users', ...adminOnly, async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json(users.map(u => u.toSafeObject()));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH approve/reject user
router.patch('/users/:id/approve', ...adminOnly, async (req, res) => {
  try {
    const { approved } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: approved },
      { new: true }
    );
    res.json({ message: approved ? 'User approved' : 'User rejected', user: user.toSafeObject() });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH toggle user active
router.patch('/users/:id/toggle', ...adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    user.isActive = !user.isActive;
    await user.save();
    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user: user.toSafeObject() });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH update admin password
router.patch('/change-password', ...adminOnly, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.user._id);
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Labs ──────────────────────────────────────────────

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
    await Lab.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lab deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Student Batches ──────────────────────────────────

router.get('/batches', ...adminOnly, async (req, res) => {
  try {
    const batches = await StudentBatch.find().populate('students', 'name email registerNumber');
    res.json(batches);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/batches', ...adminOnly, async (req, res) => {
  try {
    const { name, academicYear, focusArea } = req.body;
    // Auto-assign matching students
    const matchingStudents = await User.find({ role: 'student', academicYear, focusArea });
    const batch = await StudentBatch.create({
      name, academicYear, focusArea,
      students: matchingStudents.map(s => s._id),
      createdBy: req.user._id
    });
    await batch.populate('students', 'name email registerNumber');
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

// ── Dashboard Stats ──────────────────────────────────

router.get('/stats', ...adminOnly, async (req, res) => {
  try {
    const [totalUsers, pendingApprovals, totalLabs, totalBatches, bookings] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ isApproved: false, role: { $in: ['lecturer', 'lab_assistant'] } }),
      Lab.countDocuments({ isActive: true }),
      StudentBatch.countDocuments({ isActive: true }),
      Booking.find().populate('lab', 'name').populate('lecturer', 'name').sort({ createdAt: -1 }).limit(5)
    ]);
    res.json({ totalUsers, pendingApprovals, totalLabs, totalBatches, recentBookings: bookings });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
