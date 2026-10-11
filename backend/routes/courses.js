const express = require("express");
const Course = require("../models/Course");
const Subject = require("../models/Subject");
const Student = require("../models/Student");
const Mark = require("../models/Mark");
const Attendance = require("../models/Attendance");
const protect = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authMiddleware");

const { idParams } = require("../middleware/security");

const router = express.Router();
idParams(router, ["id", "subjectId"]);

const num = (v, fallback) =>
  v === undefined || v === null || v === "" ? fallback : Number(v);

// ---------------------------------------------------------------
// READ (any logged-in user): mentors need this for their dropdowns
// ---------------------------------------------------------------

// GET /api/courses
router.get("/", protect, async (req, res) => {
  try {
    const courses = await Course.find().sort({ name: 1 }).lean();
    const counts = await Subject.aggregate([
      { $group: { _id: "$course", count: { $sum: 1 } } },
    ]);
    const map = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

    res.json({
      courses: courses.map((c) => ({ ...c, subjectCount: map[String(c._id)] || 0 })),
    });
  } catch (error) {
    console.error("GET COURSES ERROR:", error);
    res.status(500).json({ message: "Server error while fetching courses" });
  }
});

// GET /api/courses/:id/subjects?semester=3
router.get("/:id/subjects", protect, async (req, res) => {
  try {
    const filter = { course: req.params.id };
    if (req.query.semester) filter.semester = Number(req.query.semester);

    const subjects = await Subject.find(filter).sort({ semester: 1, name: 1 });
    res.json({ subjects });
  } catch (error) {
    console.error("GET SUBJECTS ERROR:", error);
    res.status(500).json({ message: "Server error while fetching subjects" });
  }
});

// ---------------------------------------------------------------
// WRITE (admin only)
// ---------------------------------------------------------------

// POST /api/courses
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { name, code, totalSemesters } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Course name is required" });
    }

    const semesters = num(totalSemesters, 8);
    if (!Number.isInteger(semesters) || semesters < 1 || semesters > 12) {
      return res.status(400).json({ message: "Semesters must be between 1 and 12" });
    }

    const exists = await Course.findOne({ name: name.trim() });
    if (exists) {
      return res.status(400).json({ message: "Course already exists" });
    }

    const course = await Course.create({
      name: name.trim(),
      code: code ? code.trim() : name.trim(),
      totalSemesters: semesters,
      createdBy: req.user.id,
    });

    res.status(201).json({ message: "Course created", course });
  } catch (error) {
    console.error("CREATE COURSE ERROR:", error);
    res.status(500).json({ message: "Server error while creating course" });
  }
});

// PUT /api/courses/:id
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const { name, code, totalSemesters } = req.body;

    if (name !== undefined) course.name = name.trim();
    if (code !== undefined) course.code = code.trim();

    if (totalSemesters !== undefined) {
      const semesters = Number(totalSemesters);
      if (!Number.isInteger(semesters) || semesters < 1 || semesters > 12) {
        return res.status(400).json({ message: "Semesters must be between 1 and 12" });
      }
      const outOfRange = await Subject.countDocuments({
        course: course._id,
        semester: { $gt: semesters },
      });
      if (outOfRange > 0) {
        return res.status(400).json({
          message: "Remove subjects from higher semesters before reducing the semester count",
        });
      }
      course.totalSemesters = semesters;
    }

    await course.save();
    res.json({ message: "Course updated", course });
  } catch (error) {
    console.error("UPDATE COURSE ERROR:", error);
    res.status(500).json({ message: "Server error while updating course" });
  }
});

// DELETE /api/courses/:id
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const inUse = await Student.countDocuments({ course: req.params.id });
    if (inUse > 0) {
      return res.status(400).json({
        message: `${inUse} student(s) are enrolled in this course. Move them first.`,
      });
    }

    await Subject.deleteMany({ course: req.params.id });
    await Course.findByIdAndDelete(req.params.id);

    res.json({ message: "Course deleted" });
  } catch (error) {
    console.error("DELETE COURSE ERROR:", error);
    res.status(500).json({ message: "Server error while deleting course" });
  }
});

// POST /api/courses/:id/subjects
// Body: { semester, name, code, credits?, internalMax?, externalMax? }
// or    { semester, subjects: [{ name, code, ... }, ...] }  (bulk)
router.post("/:id/subjects", protect, authorize("admin"), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const semester = Number(req.body.semester);
    if (!Number.isInteger(semester) || semester < 1 || semester > course.totalSemesters) {
      return res.status(400).json({
        message: `Semester must be between 1 and ${course.totalSemesters}`,
      });
    }

    const items = Array.isArray(req.body.subjects) ? req.body.subjects : [req.body];

    const created = [];
    const skipped = [];

    for (const item of items) {
      if (!item.name || !item.code) {
        skipped.push({ name: item.name || "(no name)", reason: "Name and code are required" });
        continue;
      }

      const internalMax = num(item.internalMax, 30);
      const externalMax = num(item.externalMax, 70);

      if (!(internalMax > 0) || !(externalMax > 0)) {
        skipped.push({ name: item.name, reason: "Max marks must be greater than zero" });
        continue;
      }

      try {
        const subject = await Subject.create({
          course: course._id,
          semester,
          name: item.name.trim(),
          code: item.code.trim(),
          credits: num(item.credits, 4),
          internalMax,
          externalMax,
        });
        created.push(subject);
      } catch (err) {
        skipped.push({
          name: item.name,
          reason: err.code === 11000 ? "Subject code already exists in this semester" : err.message,
        });
      }
    }

    if (created.length === 0) {
      return res.status(400).json({ message: skipped[0]?.reason || "Nothing created", skipped });
    }

    res.status(201).json({ message: `${created.length} subject(s) added`, subjects: created, skipped });
  } catch (error) {
    console.error("ADD SUBJECT ERROR:", error);
    res.status(500).json({ message: "Server error while adding subject" });
  }
});

// PUT /api/courses/subjects/:subjectId
router.put("/subjects/:subjectId", protect, authorize("admin"), async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.subjectId);
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    const { name, code, credits, internalMax, externalMax } = req.body;

    if (name !== undefined) subject.name = name.trim();
    if (code !== undefined) subject.code = code.trim();
    if (credits !== undefined) subject.credits = Number(credits);
    if (internalMax !== undefined) subject.internalMax = Number(internalMax);
    if (externalMax !== undefined) subject.externalMax = Number(externalMax);

    await subject.save();
    res.json({ message: "Subject updated", subject });
  } catch (error) {
    console.error("UPDATE SUBJECT ERROR:", error);
    const duplicate = error.code === 11000;
    res.status(duplicate ? 400 : 500).json({
      message: duplicate ? "Subject code already exists in this semester" : "Server error while updating subject",
    });
  }
});

// DELETE /api/courses/subjects/:subjectId
router.delete("/subjects/:subjectId", protect, authorize("admin"), async (req, res) => {
  try {
    const used =
      (await Mark.countDocuments({ subjectRef: req.params.subjectId })) +
      (await Attendance.countDocuments({ subjectRef: req.params.subjectId }));

    if (used > 0) {
      return res.status(400).json({
        message: "Marks or attendance already exist for this subject, so it cannot be deleted",
      });
    }

    await Subject.findByIdAndDelete(req.params.subjectId);
    res.json({ message: "Subject deleted" });
  } catch (error) {
    console.error("DELETE SUBJECT ERROR:", error);
    res.status(500).json({ message: "Server error while deleting subject" });
  }
});

module.exports = router;
