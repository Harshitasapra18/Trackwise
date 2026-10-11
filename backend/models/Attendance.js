const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    // Link to the admin-defined catalog subject
    subjectRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    subjectCode: {
      type: String,
      trim: true,
      default: "",
    },

    semester: {
      type: Number,
      required: true,
    },

    totalClasses: {
      type: Number,
      required: true,
      min: 0,
    },

    attendedClasses: {
      type: Number,
      required: true,
      min: 0,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Attendance = mongoose.model(
  "Attendance",
  attendanceSchema
);

module.exports = Attendance;