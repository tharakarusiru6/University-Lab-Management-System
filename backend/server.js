require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/lecturer', require('./routes/lecturer'));
app.use('/api/assistant', require('./routes/labAssistant'));
app.use('/api/student', require('./routes/student'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ── Auto-expire scheduler ─────────────────────────────────────────────────────
// Runs every hour — deletes all bookings whose date has passed
async function deleteExpiredBookings() {
  try {
    const Booking = require('./models/Booking');

    // End of yesterday — anything before today's midnight is expired
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await Booking.deleteMany({ date: { $lt: today } });

    if (result.deletedCount > 0) {
      console.log(`🗑️  Auto-expired ${result.deletedCount} booking(s) older than today`);
    }
  } catch (err) {
    console.error('❌ Expire job error:', err.message);
  }
}

// ── Seed admin ────────────────────────────────────────────────────────────────
async function seedAdmin() {
  const User = require('./models/User');
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;

  const existing = await User.findOne({ email: adminEmail });
  if (!existing) {
    await User.create({
      name: 'System Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isApproved: true,
      isActive: true,
    });
    console.log(`✅ Admin seeded: ${adminEmail}`);
  } else {
    console.log(`ℹ️  Admin already exists: ${adminEmail}`);
  }
}

// ── Connect & start ───────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    await seedAdmin();

    // Run expire job immediately on startup, then every hour
    await deleteExpiredBookings();
    setInterval(deleteExpiredBookings, 60 * 60 * 1000); // every 1 hour

    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
