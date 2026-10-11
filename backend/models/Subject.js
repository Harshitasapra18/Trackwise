const mongoose = require("mongoose");

// A subject that belongs to one semester of one course.
// Admin defines these once; mentors only enter marks/attendance against them.
const subjectSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    semester: { type: Number, required: true, min: 1, max: 12 },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    credits: { type: Number, min: 0, default: 4 },
    internalMax: { type: Number, min: 1, default: 30 },
    externalMax: { type: Number, min: 1, default: 70 },
  },
  { timestamps: true }
);

subjectSchema.index({ course: 1, semester: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("Subject", subjectSchema);
