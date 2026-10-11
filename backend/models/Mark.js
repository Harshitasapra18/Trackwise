const mongoose = require("mongoose");

const markSchema = new mongoose.Schema(
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

    internalMarks: {
      type: Number,
      required: true,
      min: 0,
    },

    internalMax: {
      type: Number,
      required: true,
      min: 1,
      default: 30,
    },

    externalMarks: {
      type: Number,
      required: true,
      min: 0,
    },

    externalMax: {
      type: Number,
      required: true,
      min: 1,
      default: 70,
    },

    totalMarks: {
      type: Number,
      required: true,
      min: 0,
    },

    totalMax: {
      type: Number,
      required: true,
      min: 1,
      default: 100,
    },

    grade: {
      type: String,
      required: true,
      trim: true,
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

const Mark = mongoose.model("Mark", markSchema);

module.exports = Mark;