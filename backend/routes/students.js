const express = require("express");
const Student = require("../models/Student");
const protect = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authMiddleware");
const { idParams } = require("../middleware/security");
const { buildSummary } = require("../utils/metrics");

const router = express.Router();
idParams(router, ["studentId"]);

// NOTE: Creating students, linking mentee accounts and assigning mentors is
// now done by the admin (see routes/admin.js). Mentors can only view the
// students assigned to them.


// =========================================================
// GET ALL MENTOR'S STUDENTS
// =========================================================

router.get("/", protect, async (req, res) => {
  try {
    // Only mentor can view students
    if (req.user.role !== "mentor") {
      return res.status(403).json({
        message: "Only mentors can view students",
      });
    }

    // IMPORTANT:
    // Only students belonging to logged-in mentor
    // will be returned.
    const students = await Student.find({
      mentor: req.user.id,
    })
      .populate(
        "user",
        "fullName username email role"
      )
      .populate("course", "name code totalSemesters")
      .populate("mentor",
        "fullName username email role"
      )
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      message: "Students fetched successfully",
      students,
    });

  } catch (error) {
    console.error("Get students error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});


// =========================================================
// GET LOGGED-IN MENTEE'S PROFILE
// IMPORTANT:
// This MUST come before /:studentId
// =========================================================

router.get(
  "/mentee/me",
  protect,
  async (req, res) => {
    try {
      // Only mentee can access this route
      if (req.user.role !== "mentee") {
        return res.status(403).json({
          message:
            "Only mentees can access this profile",
        });
      }

      // Find Student linked to logged-in User
      const student = await Student.findOne({
        user: req.user.id,
      })
        .select("-mentorNotes")
        .populate("course", "name code totalSemesters")
      .populate("mentor",
          "fullName username email role"
        )
        .populate(
          "user",
          "fullName username email role"
        );

      // No linked student
      if (!student) {
        return res.status(404).json({
          message:
            "No student profile is linked to this mentee account.",
        });
      }

      res.status(200).json({
        message:
          "Mentee profile fetched successfully",
        student,
      });

    } catch (error) {
      console.error(
        "Get mentee profile error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


// =========================================================
// MENTEE: OWN SUMMARY (CGPA, semester GPA, attendance, flags...)
// =========================================================

router.get("/mentee/summary", protect, authorize("mentee"), async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id });

    if (!student) {
      return res.status(404).json({ message: "No student profile is linked to this mentee account." });
    }

    const summary = await buildSummary(student._id);

    res.status(200).json({
      summary,
      targets: {
        targetCgpa: student.targetCgpa,
        targetAttendance: student.targetAttendance,
      },
    });
  } catch (error) {
    console.error("Mentee summary error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// =========================================================
// MENTEE: BATCH COMPARISON (anonymous - only averages and own rank)
// Batch = same course and same semester.
// =========================================================

router.get("/mentee/batch", protect, authorize("mentee"), async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id });

    if (!student) {
      return res.status(404).json({ message: "No student profile is linked to this mentee account." });
    }

    if (!student.course) {
      return res.status(200).json({ available: false, reason: "No course assigned yet." });
    }

    const batch = await Student.find({
      course: student.course,
      semester: student.semester,
    }).select("cgpa attendance").lean();

    // Fewer than 3 students would make the averages identify individuals
    if (batch.length < 3) {
      return res.status(200).json({
        available: false,
        reason: "Not enough students in your batch for an anonymous comparison.",
      });
    }

    const avg = (key) =>
      Math.round((batch.reduce((sum, b) => sum + (b[key] || 0), 0) / batch.length) * 100) / 100;

    const rank = 1 + batch.filter((b) => b.cgpa > student.cgpa).length;

    res.status(200).json({
      available: true,
      batchSize: batch.length,
      you: { cgpa: student.cgpa, attendance: student.attendance },
      average: { cgpa: avg("cgpa"), attendance: avg("attendance") },
      rank,
    });
  } catch (error) {
    console.error("Mentee batch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// =========================================================
// MENTEE: SET OWN TARGETS
// =========================================================

router.put("/mentee/targets", protect, authorize("mentee"), async (req, res) => {
  try {
    const targetCgpa = Number(req.body.targetCgpa);
    const targetAttendance = Number(req.body.targetAttendance);

    if (!(targetCgpa >= 0 && targetCgpa <= 10)) {
      return res.status(400).json({ message: "Target CGPA must be between 0 and 10" });
    }

    if (!(targetAttendance >= 0 && targetAttendance <= 100)) {
      return res.status(400).json({ message: "Target attendance must be between 0 and 100" });
    }

    const student = await Student.findOneAndUpdate(
      { user: req.user.id },
      { targetCgpa, targetAttendance },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ message: "No student profile is linked to this mentee account." });
    }

    res.status(200).json({
      message: "Targets saved",
      targets: { targetCgpa: student.targetCgpa, targetAttendance: student.targetAttendance },
    });
  } catch (error) {
    console.error("Save targets error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// =========================================================
// MENTOR: SUMMARY OF ONE STUDENT (semester GPA, risk flags...)
// =========================================================

router.get("/:studentId/summary", protect, authorize("mentor"), async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.studentId, mentor: req.user.id });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ summary: await buildSummary(student._id) });
  } catch (error) {
    console.error("Student summary error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// =========================================================
// MENTOR: SAVE PRIVATE NOTES FOR A STUDENT
// =========================================================

router.put("/:studentId/notes", protect, authorize("mentor"), async (req, res) => {
  try {
    const notes = typeof req.body.notes === "string" ? req.body.notes : "";

    if (notes.length > 5000) {
      return res.status(400).json({ message: "Notes are too long (max 5000 characters)" });
    }

    const student = await Student.findOneAndUpdate(
      { _id: req.params.studentId, mentor: req.user.id },
      { mentorNotes: notes },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ message: "Notes saved", notes: student.mentorNotes });
  } catch (error) {
    console.error("Save notes error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// =========================================================
// GET SINGLE STUDENT
// IMPORTANT:
// Keep this AFTER /mentee/me
// =========================================================

router.get(
  "/:studentId",
  protect,
  async (req, res) => {
    try {
      // Only mentor can view student profile
      if (req.user.role !== "mentor") {
        return res.status(403).json({
          message:
            "Only mentors can view student profiles",
        });
      }

      // Find student belonging to logged-in mentor
      const student = await Student.findOne({
        _id: req.params.studentId,
        mentor: req.user.id,
      })
        .populate(
          "user",
          "fullName username email role"
        )
        .populate("course", "name code totalSemesters")
      .populate("mentor",
          "fullName username email role"
        );

      // Student not found
      if (!student) {
        return res.status(404).json({
          message: "Student not found",
        });
      }

      res.status(200).json({
        message:
          "Student fetched successfully",
        student,
      });

    } catch (error) {
      console.error(
        "Get single student error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


// =========================================================
// EXPORT ROUTER
// =========================================================

module.exports = router;