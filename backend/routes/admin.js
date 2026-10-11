const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Student = require("../models/Student");
const Course = require("../models/Course");
const Mark = require("../models/Mark");
const Attendance = require("../models/Attendance");
const protect = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authMiddleware");
const { idParams, str, escapeRegex, passwordProblem } = require("../middleware/security");
const Meeting = require("../models/Meeting");
const Alert = require("../models/Alert");

const router = express.Router();

// Everything in this file is admin-only
router.use(protect, authorize("admin"));
idParams(router, ["id"]);

const usernameTaken = (username) =>
  User.findOne({ username: new RegExp(`^${escapeRegex(username)}$`, "i") });

const populateStudent = (query) =>
  query
    .populate("mentor", "fullName username email")
    .populate("course", "name code totalSemesters")
    .populate("user", "fullName username email");

// ---------------------------------------------------------------
// OVERVIEW
// GET /api/admin/stats
// ---------------------------------------------------------------
router.get("/stats", async (req, res) => {
  try {
    const [mentors, mentees, students, unassigned, courses] = await Promise.all([
      User.countDocuments({ role: "mentor" }),
      User.countDocuments({ role: "mentee" }),
      Student.countDocuments(),
      Student.countDocuments({ mentor: null }),
      Course.countDocuments(),
    ]);

    res.json({ stats: { mentors, mentees, students, unassigned, courses } });
  } catch (error) {
    console.error("ADMIN STATS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------------------------------------------------------
// USERS (mentor / mentee login accounts)
// ---------------------------------------------------------------

// GET /api/admin/users?role=mentor
router.get("/users", async (req, res) => {
  try {
    const filter = { role: { $in: ["mentor", "mentee"] } };
    if (["mentor", "mentee"].includes(req.query.role)) filter.role = req.query.role;

    const users = await User.find(filter).select("-password").sort({ createdAt: -1 }).lean();

    const counts = await Student.aggregate([
      { $match: { mentor: { $ne: null } } },
      { $group: { _id: "$mentor", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

    res.json({
      users: users.map((u) => ({
        ...u,
        menteeCount: u.role === "mentor" ? countMap[String(u._id)] || 0 : undefined,
      })),
    });
  } catch (error) {
    console.error("ADMIN GET USERS ERROR:", error);
    res.status(500).json({ message: "Server error while fetching users" });
  }
});

// POST /api/admin/users  -> add a mentor or a mentee login
router.post("/users", async (req, res) => {
  try {
    const fullName = str(req.body.fullName);
    const username = str(req.body.username);
    const email = str(req.body.email).toLowerCase();
    const password = req.body.password;
    const role = str(req.body.role);

    if (!fullName || !username || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!["mentor", "mentee"].includes(role)) {
      return res.status(400).json({ message: "Role must be mentor or mentee" });
    }

    const pwProblem = passwordProblem(password);
    if (pwProblem) return res.status(400).json({ message: pwProblem });

    if (await usernameTaken(username)) {
      return res.status(400).json({ message: "Username already exists" });
    }

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const user = await User.create({
      fullName,
      username,
      email,
      password: await bcrypt.hash(password, 10),
      role,
    });

    res.status(201).json({
      message: `${role === "mentor" ? "Mentor" : "Mentee"} account created`,
      user: { _id: user._id, fullName: user.fullName, username: user.username, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("ADMIN CREATE USER ERROR:", error);
    res.status(500).json({ message: "Server error while creating user" });
  }
});

// PUT /api/admin/users/:id/password  -> reset a password
router.put("/users/:id/password", async (req, res) => {
  try {
    const { password } = req.body;

    const pwProblem = passwordProblem(password);
    if (pwProblem) return res.status(400).json({ message: pwProblem });

    const user = await User.findById(req.params.id);
    if (!user || user.role === "admin") {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    res.json({ message: "Password updated" });
  } catch (error) {
    console.error("ADMIN RESET PASSWORD ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === "admin") {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "mentor") {
      const count = await Student.countDocuments({ mentor: user._id });
      if (count > 0) {
        return res.status(400).json({
          message: `This mentor still has ${count} mentee(s). Reassign them first.`,
        });
      }
    }

    if (user.role === "mentee") {
      await Student.updateMany({ user: user._id }, { $unset: { user: "" } });
    }

    await User.findByIdAndDelete(user._id);
    res.json({ message: "User deleted" });
  } catch (error) {
    console.error("ADMIN DELETE USER ERROR:", error);
    res.status(500).json({ message: "Server error while deleting user" });
  }
});

// ---------------------------------------------------------------
// STUDENTS (profiles) + MENTOR ASSIGNMENT
// ---------------------------------------------------------------

// GET /api/admin/students?unassigned=true
router.get("/students", async (req, res) => {
  try {
    const filter = {};
    if (req.query.unassigned === "true") filter.mentor = null;
    if (req.query.mentor) filter.mentor = req.query.mentor;

    const students = await populateStudent(Student.find(filter)).sort({ createdAt: -1 });
    res.json({ students });
  } catch (error) {
    console.error("ADMIN GET STUDENTS ERROR:", error);
    res.status(500).json({ message: "Server error while fetching students" });
  }
});

// POST /api/admin/students
// Body: { fullName, rollNumber, email, courseId, semester, mentorId?,
//         account?: { username, password } }  <- optional: also create the mentee login
router.post("/students", async (req, res) => {
  try {
    const { courseId, semester, mentorId, account } = req.body;
    const fullName = str(req.body.fullName);
    const rollNumber = str(req.body.rollNumber);
    const email = str(req.body.email);

    if (!fullName || !rollNumber || !email || !courseId || !semester) {
      return res.status(400).json({
        message: "Name, roll number, email, course and semester are required",
      });
    }

    const course = mongoose.isValidObjectId(courseId) ? await Course.findById(courseId) : null;
    if (!course) return res.status(400).json({ message: "Course not found" });

    const sem = Number(semester);
    if (!Number.isInteger(sem) || sem < 1 || sem > course.totalSemesters) {
      return res.status(400).json({
        message: `Semester must be between 1 and ${course.totalSemesters} for ${course.name}`,
      });
    }

    if (await Student.findOne({ rollNumber: rollNumber.trim() })) {
      return res.status(400).json({ message: "Student with this roll number already exists" });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (await Student.findOne({ email: cleanEmail })) {
      return res.status(400).json({ message: "Student with this email already exists" });
    }

    let mentor = null;
    if (mentorId) {
      mentor = mongoose.isValidObjectId(mentorId) ? await User.findOne({ _id: mentorId, role: "mentor" }) : null;
      if (!mentor) return res.status(400).json({ message: "Selected mentor not found" });
    }

    // Optional: create the mentee login in the same step
    let menteeUser = null;
    if (account && account.username && account.password) {
      const pwProblem = passwordProblem(account.password);
      if (pwProblem) return res.status(400).json({ message: pwProblem });
      if (await usernameTaken(str(account.username))) {
        return res.status(400).json({ message: "Username already exists" });
      }
      if (await User.findOne({ email: cleanEmail })) {
        return res.status(400).json({ message: "A user with this email already exists" });
      }

      menteeUser = await User.create({
        fullName: fullName.trim(),
        username: str(account.username),
        email: cleanEmail,
        password: await bcrypt.hash(account.password, 10),
        role: "mentee",
      });
    }

    const student = await Student.create({
      fullName: fullName.trim(),
      rollNumber: rollNumber.trim(),
      email: cleanEmail,
      course: course._id,
      department: course.name,
      semester: sem,
      mentor: mentor ? mentor._id : null,
      user: menteeUser ? menteeUser._id : undefined,
    });

    res.status(201).json({
      message: "Student added",
      student: await populateStudent(Student.findById(student._id)),
    });
  } catch (error) {
    console.error("ADMIN CREATE STUDENT ERROR:", error);
    res.status(500).json({ message: "Server error while adding student" });
  }
});

// PUT /api/admin/students/assign
// Body: { studentIds: [...], mentorId }   (mentorId null/"" = unassign)
// NOTE: must stay above "/students/:id"
router.put("/students/assign", async (req, res) => {
  try {
    const { studentIds, mentorId } = req.body;

    if (
      !Array.isArray(studentIds) ||
      studentIds.length === 0 ||
      !studentIds.every((x) => mongoose.isValidObjectId(x))
    ) {
      return res.status(400).json({ message: "Select at least one valid student" });
    }

    let mentor = null;
    if (mentorId) {
      mentor = mongoose.isValidObjectId(mentorId) ? await User.findOne({ _id: mentorId, role: "mentor" }) : null;
      if (!mentor) return res.status(400).json({ message: "Selected mentor not found" });
    }

    const result = await Student.updateMany(
      { _id: { $in: studentIds } },
      { $set: { mentor: mentor ? mentor._id : null } }
    );

    res.json({
      message: mentor
        ? `${result.modifiedCount} student(s) assigned to ${mentor.fullName}`
        : `${result.modifiedCount} student(s) unassigned`,
    });
  } catch (error) {
    console.error("ADMIN ASSIGN ERROR:", error);
    res.status(500).json({ message: "Server error while assigning mentees" });
  }
});

// PUT /api/admin/students/:id   (edit name / course / semester / mentor)
router.put("/students/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const { fullName, courseId, semester, mentorId } = req.body;

    if (fullName !== undefined) student.fullName = fullName.trim();

    if (courseId !== undefined || semester !== undefined) {
      const course = await Course.findById(
        mongoose.isValidObjectId(courseId) ? courseId : student.course
      );
      if (!course) return res.status(400).json({ message: "Course not found" });

      const sem = Number(semester !== undefined ? semester : student.semester);
      if (!Number.isInteger(sem) || sem < 1 || sem > course.totalSemesters) {
        return res.status(400).json({
          message: `Semester must be between 1 and ${course.totalSemesters} for ${course.name}`,
        });
      }

      student.course = course._id;
      student.department = course.name;
      student.semester = sem;
    }

    if (mentorId !== undefined) {
      if (mentorId) {
        const mentor = mongoose.isValidObjectId(mentorId) ? await User.findOne({ _id: mentorId, role: "mentor" }) : null;
        if (!mentor) return res.status(400).json({ message: "Selected mentor not found" });
        student.mentor = mentor._id;
      } else {
        student.mentor = null;
      }
    }

    await student.save();
    res.json({
      message: "Student updated",
      student: await populateStudent(Student.findById(student._id)),
    });
  } catch (error) {
    console.error("ADMIN UPDATE STUDENT ERROR:", error);
    res.status(500).json({ message: "Server error while updating student" });
  }
});

// PUT /api/admin/students/:id/link   Body: { userId }  -> link an existing mentee login
router.put("/students/:id/link", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const menteeUser = mongoose.isValidObjectId(req.body.userId)
      ? await User.findOne({ _id: req.body.userId, role: "mentee" })
      : null;
    if (!menteeUser) return res.status(400).json({ message: "Mentee account not found" });

    const other = await Student.findOne({ user: menteeUser._id, _id: { $ne: student._id } });
    if (other) {
      return res.status(400).json({ message: "This mentee account is already linked to another student" });
    }

    student.user = menteeUser._id;
    await student.save();

    res.json({
      message: "Mentee account linked",
      student: await populateStudent(Student.findById(student._id)),
    });
  } catch (error) {
    console.error("ADMIN LINK ERROR:", error);
    res.status(500).json({ message: "Server error while linking account" });
  }
});

// DELETE /api/admin/students/:id
router.delete("/students/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    await Mark.deleteMany({ student: student._id });
    await Attendance.deleteMany({ student: student._id });
    await Meeting.deleteMany({ student: student._id });
    await Alert.updateMany({ recipients: student._id }, { $pull: { recipients: student._id } });
    await Alert.deleteMany({ recipients: { $size: 0 } });
    await Student.findByIdAndDelete(student._id);

    res.json({ message: "Student deleted" });
  } catch (error) {
    console.error("ADMIN DELETE STUDENT ERROR:", error);
    res.status(500).json({ message: "Server error while deleting student" });
  }
});

module.exports = router;
