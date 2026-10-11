const express = require("express");

const Alert = require("../models/Alert");
const Student = require("../models/Student");
const protect = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authMiddleware");
const mongoose = require("mongoose");
const { str } = require("../middleware/security");

const router = express.Router();

// =========================================================
// SEND BULK ALERT
// =========================================================

router.post("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "mentor") {
      return res.status(403).json({
        message: "Only mentors can send alerts",
      });
    }

    const { studentIds, type, priority } = req.body;
    const subject = str(req.body.subject);
    const message = str(req.body.message);

    if (
      !studentIds ||
      !Array.isArray(studentIds) ||
      studentIds.length === 0
    ) {
      return res.status(400).json({
        message: "Please select at least one student",
      });
    }

    if (!type || !subject || !message) {
      return res.status(400).json({
        message:
          "Alert type, subject and message are required",
      });
    }

    if (!studentIds.every((id) => mongoose.isValidObjectId(id))) {
      return res.status(400).json({ message: "One or more selected students are invalid" });
    }

    const validTypes = ["Attendance Alert", "Credit Alert", "Meeting Reminder", "Performance Alert", "General Notice"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid alert type" });
    }

    if (priority !== undefined && !["High", "Medium", "Low"].includes(priority)) {
      return res.status(400).json({ message: "Invalid priority" });
    }

    // Make sure selected students belong to this mentor
    const students = await Student.find({
      _id: { $in: studentIds },
      mentor: req.user.id,
    });

    if (students.length !== new Set(studentIds.map(String)).size) {
      return res.status(400).json({
        message:
          "One or more selected students are invalid",
      });
    }

    const alert = await Alert.create({
      mentor: req.user.id,
      recipients: [...new Set(studentIds.map(String))],
      type,
      subject,
      message,
      priority: priority || "Medium",
      status: "Delivered",
    });

    const populatedAlert =
      await Alert.findById(alert._id)
        .populate(
          "recipients",
          "fullName rollNumber department semester"
        )
        .populate(
          "mentor",
          "fullName username"
        );

    res.status(201).json({
      message: "Alert sent successfully",
      alert: populatedAlert,
    });
  } catch (error) {
    console.error(
      "Send alert error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =========================================================
// GET ALERTS FOR MENTOR
// =========================================================

router.get("/", protect, authorize("mentor"), async (req, res) => {
  try {
    const alerts = await Alert.find({
      mentor: req.user.id,
    })
      .populate(
        "recipients",
        "fullName rollNumber department semester"
      )
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      message: "Alerts fetched successfully",
      alerts,
    });
  } catch (error) {
    console.error(
      "Get alerts error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =========================================================
// MENTEE: ALERTS SENT TO ME
// =========================================================

router.get("/mentee/me", protect, authorize("mentee"), async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id });

    if (!student) {
      return res.status(404).json({ message: "No student profile is linked to this mentee account." });
    }

    // Only this student's own alerts; other recipients are not exposed
    const alerts = await Alert.find({ recipients: student._id })
      .select("type subject message priority createdAt")
      .populate("mentor", "fullName")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ alerts });
  } catch (error) {
    console.error("Mentee alerts error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;