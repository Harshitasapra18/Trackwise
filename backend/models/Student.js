const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },

    rollNumber: { type: String, required: true, unique: true, trim: true },

    email: { type: String, required: true, unique: true, trim: true, lowercase: true },

    department: { type: String, trim: true, default: "" },

    // Course (e.g. CSE) set by admin; drives which subjects the student has
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },

    semester: { type: Number, required: true, min: 1, max: 12 },

    // cgpa / attendance / riskStatus are calculated from marks + attendance
    // (see utils/metrics.js) - they are never typed in by hand.
    cgpa: { type: Number, default: 0, min: 0, max: 10 },

    attendance: { type: Number, default: 0, min: 0, max: 100 },

    // Linked mentee login account
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, sparse: true },

    // Assigned by admin
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Goals set by the mentee on the Academic Target page
    targetCgpa: { type: Number, min: 0, max: 10, default: 8 },

    targetAttendance: { type: Number, min: 0, max: 100, default: 75 },

    // Private notes written by the mentor
    mentorNotes: { type: String, default: "", maxlength: 5000 },

    riskStatus: { type: String, enum: ["Safe", "At Risk"], default: "Safe" },
  },
  { timestamps: true }
);

studentSchema.index({ mentor: 1 });

module.exports = mongoose.model("Student", studentSchema);
