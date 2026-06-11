const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'lecturer', 'lab_assistant', 'student'], 
    required: true 
  },
  // Student-specific fields
  academicYear: { type: String }, // e.g. "2nd Year"
  focusArea: { type: String },    // e.g. "Computer Science"
  registerNumber: { type: String, unique: true, sparse: true },
  // Approval status for lecturer and lab_assistant
  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  // Admin is auto-approved
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
