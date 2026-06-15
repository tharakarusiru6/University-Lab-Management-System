require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Pre-load ALL models before routes (prevents circular dependency issues) ──
require('./models/User');
require('./models/Lab');
require('./models/StudentBatch');
require('./models/Semester');
require('./models/Booking');
require('./models/RecurringBooking');

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/admin',     require('./routes/admin'));
app.use('/api/lecturer',  require('./routes/lecturer'));
app.use('/api/assistant', require('./routes/labAssistant'));
app.use('/api/student',   require('./routes/student'));
app.use('/api/semesters', require('./routes/semester'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ── Auto-expire scheduler ─────────────────────────────────────────────────────
async function deleteExpiredBookings() {
  try {
    const Booking  = mongoose.model('Booking');
    const Semester = mongoose.model('Semester');
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const bookingResult = await Booking.deleteMany({ date: { $lt: today } });
    if (bookingResult.deletedCount > 0)
      console.log(`🗑️  Auto-expired ${bookingResult.deletedCount} booking(s)`);

    const expired = await Semester.find({ endDate: { $lt: today } });
    for (const sem of expired) {
      await Booking.deleteMany({ semester: sem._id });
      await Semester.findByIdAndDelete(sem._id);
      console.log(`🗑️  Deleted expired semester: ${sem.name}`);
    }
  } catch (err) {
    console.error('❌ Expire job error:', err.message);
  }
}

// ── Seed admin ────────────────────────────────────────────────────────────────
async function seedAdmin() {
  const User = mongoose.model('User');
  const existing = await User.findOne({ email: process.env.ADMIN_EMAIL });
  if (!existing) {
    await User.create({
      name: 'System Admin',
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_SEED_PASSWORD,
      role: 'admin',
      isApproved: true,
      isActive: true,
    });
    console.log(`✅ Admin seeded: ${process.env.ADMIN_EMAIL}`);
  } else {
    console.log(`ℹ️  Admin already exists: ${process.env.ADMIN_EMAIL}`);
  }
}

// ── Connect & start ───────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    await seedAdmin();
    await deleteExpiredBookings();
    setInterval(deleteExpiredBookings, 60 * 60 * 1000);
    app.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
