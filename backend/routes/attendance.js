const express = require("express");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const protect = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authMiddleware");
const { resolveSubject, syncOverallAttendance } = require("../utils/catalog");
const { idParams } = require("../middleware/security");

const router = express.Router();
idParams(router, ["attendanceId", "studentId"]);

const populateAttendance = (query) =>
  query
    .populate("student", "fullName rollNumber email department semester")
    .populate("createdBy", "fullName username email");

const validateCounts = (total, attended) => {
  if (Number.isNaN(total) || Number.isNaN(attended)) return "Attendance values must be numbers";
  if (total < 0) return "Total classes cannot be negative";
  if (attended < 0) return "Attended classes cannot be negative";
  if (attended > total) return "Attended classes cannot be greater than total classes";
  return null;
};

// =====================================================
// ADD ATTENDANCE  (mentor, for one of their own mentees)
// POST /api/attendance
// Body: { student, subjectId, totalClasses, attendedClasses }
// =====================================================
router.post("/", protect, authorize("mentor"), async (req, res) => {
  try {
    const { student, subjectId, totalClasses, attendedClasses } = req.body;

    if (!student || !subjectId || totalClasses === undefined || totalClasses === "" ||
        attendedClasses === undefined || attendedClasses === "") {
      return res.status(400).json({ message: "Student, subject, total classes and attended classes are required" });
    }

    const studentData = await Student.findOne({ _id: String(student), mentor: req.user.id });
    if (!studentData) {
      return res.status(404).json({ message: "Student not found under your mentorship" });
    }

    const resolved = await resolveSubject(studentData, String(subjectId));
    if (resolved.message) return res.status(resolved.status).json({ message: resolved.message });
    const { subject } = resolved;

    const total = Number(totalClasses);
    const attended = Number(attendedClasses);

    const problem = validateCounts(total, attended);
    if (problem) return res.status(400).json({ message: problem });

    const existing = await Attendance.findOne({ student: studentData._id, subjectRef: subject._id });
    if (existing) {
      return res.status(400).json({ message: "Attendance for this subject already exists. Edit it instead." });
    }

    const attendance = await Attendance.create({
      student: studentData._id,
      subjectRef: subject._id,
      subject: subject.name,
      subjectCode: subject.code,
      semester: subject.semester,
      totalClasses: total,
      attendedClasses: attended,
      createdBy: req.user.id,
    });

    await syncOverallAttendance(studentData._id);

    res.status(201).json({
      message: "Attendance added successfully",
      attendance: await populateAttendance(Attendance.findById(attendance._id)),
    });
  } catch (error) {
    console.error("ADD ATTENDANCE ERROR:", error);
    res.status(500).json({ message: "Server error while adding attendance" });
  }
});

// =====================================================
// GET ATTENDANCE FOR LOGGED-IN MENTEE
// GET /api/attendance/mentee/me
// =====================================================
router.get("/mentee/me", protect, async (req, res) => {
  try {
    if (req.user.role !== "mentee") {
      return res.status(403).json({ message: "Only mentees can access their attendance" });
    }

    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ message: "No student profile is linked to this mentee account" });
    }

    const attendance = await Attendance.find({ student: student._id }).sort({ semester: 1, subject: 1 });
    res.status(200).json({ message: "Attendance fetched successfully", attendance });
  } catch (error) {
    console.error("GET MENTEE ATTENDANCE ERROR:", error);
    res.status(500).json({ message: "Server error while fetching attendance" });
  }
});

// =====================================================
// GET ATTENDANCE FOR A STUDENT (mentor of that student)
// GET /api/attendance/student/:studentId
// =====================================================
router.get("/student/:studentId", protect, authorize("mentor"), async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.studentId, mentor: req.user.id });
    if (!student) {
      return res.status(404).json({ message: "Student not found under your mentorship" });
    }

    const attendance = await Attendance.find({ student: student._id }).sort({ semester: 1, subject: 1 });
    res.status(200).json({ message: "Attendance fetched successfully", attendance });
  } catch (error) {
    console.error("GET STUDENT ATTENDANCE ERROR:", error);
    res.status(500).json({ message: "Server error while fetching attendance" });
  }
});

// =====================================================
// UPDATE ATTENDANCE (only the class counts)
// PUT /api/attendance/:attendanceId
// =====================================================
router.put("/:attendanceId", protect, authorize("mentor"), async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.attendanceId);
    if (!attendance) return res.status(404).json({ message: "Attendance not found" });

    const student = await Student.findOne({ _id: attendance.student, mentor: req.user.id });
    if (!student) {
      return res.status(403).json({ message: "You cannot update attendance for this student" });
    }

    const { totalClasses, attendedClasses } = req.body;
    if (totalClasses === undefined || totalClasses === "" ||
        attendedClasses === undefined || attendedClasses === "") {
      return res.status(400).json({ message: "Total classes and attended classes are required" });
    }

    const total = Number(totalClasses);
    const attended = Number(attendedClasses);

    const problem = validateCounts(total, attended);
    if (problem) return res.status(400).json({ message: problem });

    attendance.totalClasses = total;
    attendance.attendedClasses = attended;
    await attendance.save();

    await syncOverallAttendance(student._id);

    res.status(200).json({
      message: "Attendance updated successfully",
      attendance: await populateAttendance(Attendance.findById(attendance._id)),
    });
  } catch (error) {
    console.error("UPDATE ATTENDANCE ERROR:", error);
    res.status(500).json({ message: "Server error while updating attendance" });
  }
});

// =====================================================
// DELETE ATTENDANCE
// DELETE /api/attendance/:attendanceId
// =====================================================
router.delete("/:attendanceId", protect, authorize("mentor"), async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.attendanceId);
    if (!attendance) return res.status(404).json({ message: "Attendance not found" });

    const student = await Student.findOne({ _id: attendance.student, mentor: req.user.id });
    if (!student) {
      return res.status(403).json({ message: "You cannot delete attendance for this student" });
    }

    await Attendance.findByIdAndDelete(req.params.attendanceId);
    await syncOverallAttendance(student._id);

    res.status(200).json({ message: "Attendance deleted successfully" });
  } catch (error) {
    console.error("DELETE ATTENDANCE ERROR:", error);
    res.status(500).json({ message: "Server error while deleting attendance" });
  }
});

module.exports = router;
