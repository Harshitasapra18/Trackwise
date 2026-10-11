const express = require("express");
const Mark = require("../models/Mark");
const Student = require("../models/Student");
const protect = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authMiddleware");
const { resolveSubject } = require("../utils/catalog");
const { syncStudentMetrics } = require("../utils/metrics");
const { idParams } = require("../middleware/security");
const { calculateGrade } = require("../utils/grade");

const router = express.Router();
idParams(router, ["markId", "studentId"]);

const populateMark = (query) =>
  query
    .populate("student", "fullName rollNumber email department semester")
    .populate("createdBy", "fullName username email");

// Validates marks against the subject's max (set by admin). Returns an error string or null.
const validateMarks = (internal, external, subject) => {
  if (Number.isNaN(internal) || Number.isNaN(external)) {
    return "Marks must be valid numbers";
  }
  if (internal < 0 || internal > subject.internalMax) {
    return `Internal marks must be between 0 and ${subject.internalMax}`;
  }
  if (external < 0 || external > subject.externalMax) {
    return `External marks must be between 0 and ${subject.externalMax}`;
  }
  return null;
};

// =====================================================
// ADD MARKS  (mentor, for one of their own mentees)
// POST /api/marks
// Body: { student, subjectId, internalMarks, externalMarks }
// Subject name/code/semester/max marks/grade all come from the catalog.
// =====================================================
router.post("/", protect, authorize("mentor"), async (req, res) => {
  try {
    const { student, subjectId, internalMarks, externalMarks } = req.body;

    if (!student || !subjectId || internalMarks === undefined || internalMarks === "" ||
        externalMarks === undefined || externalMarks === "") {
      return res.status(400).json({ message: "Student, subject, internal and external marks are required" });
    }

    const studentData = await Student.findOne({ _id: String(student), mentor: req.user.id });
    if (!studentData) {
      return res.status(404).json({ message: "Student not found under your mentorship" });
    }

    const resolved = await resolveSubject(studentData, String(subjectId));
    if (resolved.message) return res.status(resolved.status).json({ message: resolved.message });
    const { subject } = resolved;

    const internal = Number(internalMarks);
    const external = Number(externalMarks);

    const problem = validateMarks(internal, external, subject);
    if (problem) return res.status(400).json({ message: problem });

    const existing = await Mark.findOne({ student: studentData._id, subjectRef: subject._id });
    if (existing) {
      return res.status(400).json({ message: "Marks for this subject already exist. Edit them instead." });
    }

    const totalMarks = internal + external;
    const totalMax = subject.internalMax + subject.externalMax;

    const mark = await Mark.create({
      student: studentData._id,
      subjectRef: subject._id,
      subject: subject.name,
      subjectCode: subject.code,
      semester: subject.semester,
      internalMarks: internal,
      internalMax: subject.internalMax,
      externalMarks: external,
      externalMax: subject.externalMax,
      totalMarks,
      totalMax,
      grade: calculateGrade(totalMarks, totalMax),
      createdBy: req.user.id,
    });

    await syncStudentMetrics(studentData._id);

    res.status(201).json({
      message: "Marks added successfully",
      mark: await populateMark(Mark.findById(mark._id)),
    });
  } catch (error) {
    console.error("ADD MARKS ERROR:", error);
    res.status(500).json({ message: "Server error while adding marks" });
  }
});

// =====================================================
// GET MARKS FOR LOGGED-IN MENTEE
// GET /api/marks/mentee/me
// =====================================================
router.get("/mentee/me", protect, async (req, res) => {
  try {
    if (req.user.role !== "mentee") {
      return res.status(403).json({ message: "Only mentees can access their marks" });
    }

    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ message: "No student profile is linked to this mentee account" });
    }

    const marks = await Mark.find({ student: student._id }).sort({ semester: 1, subject: 1 });
    res.status(200).json({ message: "Marks fetched successfully", marks });
  } catch (error) {
    console.error("GET MENTEE MARKS ERROR:", error);
    res.status(500).json({ message: "Server error while fetching marks" });
  }
});

// =====================================================
// GET MARKS FOR A STUDENT (mentor of that student)
// GET /api/marks/student/:studentId
// =====================================================
router.get("/student/:studentId", protect, authorize("mentor"), async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.studentId, mentor: req.user.id });
    if (!student) {
      return res.status(404).json({ message: "Student not found under your mentorship" });
    }

    const marks = await Mark.find({ student: student._id }).sort({ semester: 1, subject: 1 });
    res.status(200).json({ message: "Marks fetched successfully", marks });
  } catch (error) {
    console.error("GET STUDENT MARKS ERROR:", error);
    res.status(500).json({ message: "Server error while fetching marks" });
  }
});

// =====================================================
// UPDATE MARKS  (only the scores - the subject itself is fixed)
// PUT /api/marks/:markId
// =====================================================
router.put("/:markId", protect, authorize("mentor"), async (req, res) => {
  try {
    const mark = await Mark.findById(req.params.markId);
    if (!mark) return res.status(404).json({ message: "Marks not found" });

    const student = await Student.findOne({ _id: mark.student, mentor: req.user.id });
    if (!student) {
      return res.status(403).json({ message: "You cannot update marks for this student" });
    }

    const { internalMarks, externalMarks } = req.body;
    if (internalMarks === undefined || internalMarks === "" ||
        externalMarks === undefined || externalMarks === "") {
      return res.status(400).json({ message: "Internal and external marks are required" });
    }

    const internal = Number(internalMarks);
    const external = Number(externalMarks);

    // Max marks come from the stored record (copied from the catalog when created)
    const problem = validateMarks(internal, external, mark);
    if (problem) return res.status(400).json({ message: problem });

    mark.internalMarks = internal;
    mark.externalMarks = external;
    mark.totalMarks = internal + external;
    mark.totalMax = mark.internalMax + mark.externalMax;
    mark.grade = calculateGrade(mark.totalMarks, mark.totalMax);

    await mark.save();
    await syncStudentMetrics(student._id);

    res.status(200).json({
      message: "Marks updated successfully",
      mark: await populateMark(Mark.findById(mark._id)),
    });
  } catch (error) {
    console.error("UPDATE MARKS ERROR:", error);
    res.status(500).json({ message: "Server error while updating marks" });
  }
});

// =====================================================
// DELETE MARKS
// DELETE /api/marks/:markId
// =====================================================
router.delete("/:markId", protect, authorize("mentor"), async (req, res) => {
  try {
    const mark = await Mark.findById(req.params.markId);
    if (!mark) return res.status(404).json({ message: "Marks not found" });

    const student = await Student.findOne({ _id: mark.student, mentor: req.user.id });
    if (!student) {
      return res.status(403).json({ message: "You cannot delete marks for this student" });
    }

    await Mark.findByIdAndDelete(req.params.markId);
    await syncStudentMetrics(student._id);
    res.status(200).json({ message: "Marks deleted successfully" });
  } catch (error) {
    console.error("DELETE MARKS ERROR:", error);
    res.status(500).json({ message: "Server error while deleting marks" });
  }
});

module.exports = router;
