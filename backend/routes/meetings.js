const express = require("express");
const mongoose = require("mongoose");
const Meeting = require("../models/Meeting");
const Student = require("../models/Student");
const protect = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authMiddleware");
const { idParams, str } = require("../middleware/security");

const router = express.Router();
idParams(router, ["meetingId"]);

// ================= CREATE MEETING =================

router.post("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "mentor") {
      return res.status(403).json({
        message: "Only mentors can schedule meetings",
      });
    }

    const studentId = str(req.body.studentId);
    const title = str(req.body.title);
    const date = req.body.date;
    const mode = req.body.mode;
    const notes = typeof req.body.notes === "string" ? req.body.notes : "";

    if (!studentId || !title || !date) {
      return res.status(400).json({
        message: "Student, title and date are required",
      });
    }

    if (!mongoose.isValidObjectId(studentId) || Number.isNaN(new Date(date).getTime())) {
      return res.status(400).json({ message: "Invalid student or date" });
    }

    if (mode !== undefined && !["Online", "Offline"].includes(mode)) {
      return res.status(400).json({ message: "Mode must be Online or Offline" });
    }

    // Check student belongs to logged-in mentor
    const student = await Student.findOne({
      _id: studentId,
      mentor: req.user.id,
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    const meeting = await Meeting.create({
      student: studentId,
      mentor: req.user.id,
      title,
      date,
      mode: mode || "Online",
      notes: notes || "",
      status: "Scheduled",
    });

    const populatedMeeting = await Meeting.findById(
      meeting._id
    )
      .populate("student", "fullName rollNumber department semester")
      .populate("mentor", "fullName username");

    res.status(201).json({
      message: "Meeting scheduled successfully",
      meeting: populatedMeeting,
    });

  } catch (error) {
    console.error("Create meeting error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});


// ================= GET ALL MEETINGS =================

router.get("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "mentor") {
      return res.status(403).json({
        message: "Only mentors can view meetings",
      });
    }

    const meetings = await Meeting.find({
      mentor: req.user.id,
    })
      .populate(
        "student",
        "fullName rollNumber department semester"
      )
      .sort({ date: 1 });

    res.status(200).json({
      message: "Meetings fetched successfully",
      meetings,
    });

  } catch (error) {
    console.error("Get meetings error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});


// ================= MENTEE: OWN MEETINGS =================

router.get("/mentee/me", protect, authorize("mentee"), async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id });

    if (!student) {
      return res.status(404).json({ message: "No student profile is linked to this mentee account." });
    }

    const meetings = await Meeting.find({ student: student._id })
      .populate("mentor", "fullName")
      .sort({ date: 1 });

    res.status(200).json({ meetings });
  } catch (error) {
    console.error("Mentee meetings error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= UPDATE MEETING STATUS =================

router.put("/:meetingId", protect, async (req, res) => {
  try {
    if (req.user.role !== "mentor") {
      return res.status(403).json({
        message: "Only mentors can update meetings",
      });
    }

    const meeting = await Meeting.findOne({
      _id: req.params.meetingId,
      mentor: req.user.id,
    });

    if (!meeting) {
      return res.status(404).json({
        message: "Meeting not found",
      });
    }

    const {
      title,
      date,
      mode,
      status,
      notes,
    } = req.body;

    if (title !== undefined) {
      meeting.title = str(title);
    }

    if (date !== undefined) {
      if (Number.isNaN(new Date(date).getTime())) {
        return res.status(400).json({ message: "Invalid date" });
      }
      meeting.date = date;
    }

    if (mode !== undefined) {
      if (!["Online", "Offline"].includes(mode)) {
        return res.status(400).json({ message: "Mode must be Online or Offline" });
      }
      meeting.mode = mode;
    }

    if (status !== undefined) {
      if (!["Scheduled", "Completed", "Pending", "Cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      meeting.status = status;
    }

    if (notes !== undefined) {
      meeting.notes = notes;
    }

    await meeting.save();

    const updatedMeeting = await Meeting.findById(
      meeting._id
    ).populate(
      "student",
      "fullName rollNumber department semester"
    );

    res.status(200).json({
      message: "Meeting updated successfully",
      meeting: updatedMeeting,
    });

  } catch (error) {
    console.error("Update meeting error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});


// ================= DELETE MEETING =================

router.delete("/:meetingId", protect, async (req, res) => {
  try {
    if (req.user.role !== "mentor") {
      return res.status(403).json({
        message: "Only mentors can delete meetings",
      });
    }

    const meeting = await Meeting.findOneAndDelete({
      _id: req.params.meetingId,
      mentor: req.user.id,
    });

    if (!meeting) {
      return res.status(404).json({
        message: "Meeting not found",
      });
    }

    res.status(200).json({
      message: "Meeting deleted successfully",
    });

  } catch (error) {
    console.error("Delete meeting error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});


module.exports = router;