const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  startDate:   { type: Date,   required: true },
  endDate:     { type: Date,   required: true },
  description: { type: String },
  studentBatches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'StudentBatch' }],
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Semester', semesterSchema);
