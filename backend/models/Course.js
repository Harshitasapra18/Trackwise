const mongoose = require("mongoose");

// A programme such as "CSE" with a fixed number of semesters.
const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    code: { type: String, trim: true, uppercase: true, default: "" },
    totalSemesters: { type: Number, required: true, min: 1, max: 12, default: 8 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
