const Subject = require("../models/Subject");
const { syncStudentMetrics } = require("./metrics");

// Mentors may only enter data for subjects the admin defined for the
// student's own course, up to the student's current semester.
const resolveSubject = async (student, subjectId) => {
  if (!student.course) {
    return {
      status: 400,
      message: "Admin has not assigned a course to this student yet",
    };
  }

  if (!subjectId) {
    return { status: 400, message: "Please select a subject" };
  }

  const subject = await Subject.findById(subjectId);

  if (!subject || String(subject.course) !== String(student.course)) {
    return { status: 400, message: "This subject does not belong to the student's course" };
  }

  if (subject.semester > student.semester) {
    return {
      status: 400,
      message: `This subject is in semester ${subject.semester}; the student is only in semester ${student.semester}`,
    };
  }

  return { subject };
};

// Keep Student.attendance / cgpa / riskStatus in sync with the records
const syncOverallAttendance = (studentId) => syncStudentMetrics(studentId);

module.exports = { resolveSubject, syncOverallAttendance };
