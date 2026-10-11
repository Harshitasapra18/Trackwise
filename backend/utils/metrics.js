const Mark = require("../models/Mark");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const Subject = require("../models/Subject");

// 10-point scale (matches the grades in utils/grade.js)
const GRADE_POINTS = { O: 10, "A+": 9, A: 8, "B+": 7, B: 6, C: 5, F: 0 };

const CGPA_RISK_BELOW = 6.5;
const ATTENDANCE_RISK_BELOW = 75;

const round2 = (n) => Math.round(n * 100) / 100;

// Credit-weighted average of grade points
const gpa = (marks, creditOf) => {
  let points = 0;
  let credits = 0;

  for (const m of marks) {
    const c = creditOf(m);
    points += (GRADE_POINTS[m.grade] ?? 0) * c;
    credits += c;
  }

  return credits > 0 ? round2(points / credits) : 0;
};

// Builds everything the dashboards need from the raw marks + attendance
const buildSummary = async (studentId) => {
  const [marks, attendance] = await Promise.all([
    Mark.find({ student: studentId }).lean(),
    Attendance.find({ student: studentId }).lean(),
  ]);

  const subjectIds = marks.map((m) => m.subjectRef).filter(Boolean);
  const subjects = await Subject.find({ _id: { $in: subjectIds } }).select("credits").lean();
  const creditMap = Object.fromEntries(subjects.map((s) => [String(s._id), s.credits]));

  // Subjects without a catalog entry (old data) count as 4 credits
  const creditOf = (m) => {
    const c = m.subjectRef ? creditMap[String(m.subjectRef)] : undefined;
    return c === undefined || c === null ? 4 : c;
  };

  const cgpa = gpa(marks, creditOf);

  const semesters = [...new Set(marks.map((m) => m.semester))].sort((a, b) => a - b);
  const semesterGpa = semesters.map((sem) => ({
    semester: sem,
    sgpa: gpa(marks.filter((m) => m.semester === sem), creditOf),
  }));

  const totalClasses = attendance.reduce((s, a) => s + a.totalClasses, 0);
  const attended = attendance.reduce((s, a) => s + a.attendedClasses, 0);
  const overallAttendance = totalClasses > 0 ? Math.round((attended / totalClasses) * 1000) / 10 : 0;

  const lowAttendance = attendance.filter(
    (a) => a.totalClasses > 0 && (a.attendedClasses / a.totalClasses) * 100 < ATTENDANCE_RISK_BELOW
  );
  const backlogs = marks.filter((m) => m.grade === "F");

  const earnedCredits = marks.filter((m) => m.grade !== "F").reduce((s, m) => s + creditOf(m), 0);

  const flags = [];
  if (marks.length > 0 && cgpa < CGPA_RISK_BELOW) flags.push(`CGPA below ${CGPA_RISK_BELOW}`);
  if (attendance.length > 0 && overallAttendance < ATTENDANCE_RISK_BELOW) {
    flags.push(`Overall attendance below ${ATTENDANCE_RISK_BELOW}%`);
  }
  lowAttendance.forEach((a) => flags.push(`Low attendance in ${a.subject}`));
  backlogs.forEach((m) => flags.push(`Backlog in ${m.subject}`));

  return {
    cgpa,
    overallAttendance,
    semesterGpa,
    subjectsWithMarks: marks.length,
    earnedCredits,
    backlogCount: backlogs.length,
    flags,
    riskStatus: flags.length > 0 ? "At Risk" : "Safe",
  };
};

// Writes cgpa / attendance / riskStatus onto the Student document.
// Call after any marks or attendance change.
const syncStudentMetrics = async (studentId) => {
  const s = await buildSummary(studentId);

  await Student.findByIdAndUpdate(studentId, {
    cgpa: Math.min(10, s.cgpa),
    attendance: s.overallAttendance,
    riskStatus: s.riskStatus,
  });

  return s;
};

module.exports = { buildSummary, syncStudentMetrics, CGPA_RISK_BELOW, ATTENDANCE_RISK_BELOW };
