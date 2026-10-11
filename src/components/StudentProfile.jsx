import "./StudentProfile.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  FaHome,
  FaUsers,
  FaCalendarAlt,
  FaBell,
  FaChartBar,
  FaSignOutAlt,
  FaGraduationCap,
  FaBookOpen,
  FaExclamationTriangle,
  FaUserCircle,
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
} from "react-icons/fa";

function StudentProfile() {
  const navigate = useNavigate();
  const { studentId } = useParams();

  // ================= Student State =================

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  // ================= Marks State =================

  const [marks, setMarks] = useState([]);
  const [marksLoading, setMarksLoading] = useState(true);

  const [showMarksForm, setShowMarksForm] = useState(false);
  const [editingMark, setEditingMark] = useState(null);
  const [savingMark, setSavingMark] = useState(false);

  const [markForm, setMarkForm] = useState({
    subjectId: "",
    internalMarks: "",
    externalMarks: "",
  });

  // ================= Subject Catalog (defined by admin) =================

  const [subjects, setSubjects] = useState([]);

  // ================= Tabs, summary, meetings, notes =================

  const [activeTab, setActiveTab] = useState("overview");
  const [summary, setSummary] = useState(null);
  const [studentMeetings, setStudentMeetings] = useState([]);
  const [notesDraft, setNotesDraft] = useState(null);
  const [savingNotes, setSavingNotes] = useState(false);

  // ================= Attendance State =================

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [savingAttendance, setSavingAttendance] = useState(false);

  const [attendanceForm, setAttendanceForm] = useState({
    subjectId: "",
    totalClasses: "",
    attendedClasses: "",
  });

  // ================= Logout =================

  const handleLogout = () => {
    localStorage.removeItem("trackwiseToken");
    localStorage.removeItem("trackwiseUser");

    navigate("/login", { replace: true });
  };

  // ================= Fetch Student =================

  useEffect(() => {
    if (!studentId) {
      navigate("/my-mentees", { replace: true });
      return;
    }

    const fetchStudent = async () => {
      try {
        const token = localStorage.getItem("trackwiseToken");

        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

        const response = await fetch(
          `http://localhost:5000/api/students/${studentId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          setStudent(data.student);
        } else {
          console.error("Error:", data.message);

          if (response.status === 401) {
            localStorage.removeItem("trackwiseToken");
            localStorage.removeItem("trackwiseUser");
            navigate("/login", { replace: true });
          }
        }
      } catch (error) {
        console.error("Error fetching student:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [studentId, navigate]);

  // ================= Fetch Marks =================

  const fetchMarks = async () => {
    try {
      const token = localStorage.getItem("trackwiseToken");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/marks/student/${studentId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMarks(data.marks || []);
      } else {
        console.error("Error fetching marks:", data.message);
      }
    } catch (error) {
      console.error("Error fetching marks:", error);
    } finally {
      setMarksLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchMarks();
      fetchAttendance();
    }
  }, [studentId]);

  // ================= Fetch Attendance =================

  async function fetchAttendance() {
    try {
      const token = localStorage.getItem("trackwiseToken");

      const response = await fetch(
        `http://localhost:5000/api/attendance/student/${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();

      if (response.ok) {
        setAttendanceRecords(data.attendance || []);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  }

  // ================= Fetch summary (CGPA trend, flags, credits) =================

  useEffect(() => {
    if (!studentId) return;

    const loadSummary = async () => {
      try {
        const token = localStorage.getItem("trackwiseToken");

        const response = await fetch(
          `http://localhost:5000/api/students/${studentId}/summary`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = await response.json();

        if (response.ok) {
          setSummary(data.summary);
        }
      } catch (error) {
        console.error("Error fetching summary:", error);
      }
    };

    loadSummary();
  }, [studentId, marks, attendanceRecords]);

  // ================= Fetch this student's meetings =================

  useEffect(() => {
    if (!studentId) return;

    const loadMeetings = async () => {
      try {
        const token = localStorage.getItem("trackwiseToken");

        const response = await fetch("http://localhost:5000/api/meetings", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (response.ok) {
          setStudentMeetings(
            (data.meetings || [])
              .filter((m) => String(m.student?._id) === String(studentId))
              .sort((a, b) => new Date(b.date) - new Date(a.date))
          );
        }
      } catch (error) {
        console.error("Error fetching meetings:", error);
      }
    };

    loadMeetings();
  }, [studentId]);

  // ================= Fetch Subjects of the student's course =================

  const courseId = student?.course?._id;

  useEffect(() => {
    if (!courseId) return;

    const loadSubjects = async () => {
      try {
        const token = localStorage.getItem("trackwiseToken");

        const response = await fetch(
          `http://localhost:5000/api/courses/${courseId}/subjects`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = await response.json();

        if (response.ok) {
          setSubjects(data.subjects || []);
        }
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    };

    loadSubjects();
  }, [courseId]);

  // ================= Loading =================

  if (loading) {
    return (
      <div className="student-profile-page">
        <main className="student-main">
          <h1>Loading Student Profile...</h1>
        </main>
      </div>
    );
  }

  // ================= Student Not Found =================

  if (!student) {
    return (
      <div className="student-profile-page">
        <main className="student-main">
          <Link to="/my-mentees" className="student-back">
            ← Back to Mentees
          </Link>

          <h1>Student Not Found</h1>

          <p className="student-subtitle">
            Unable to find this student.
          </p>
        </main>
      </div>
    );
  }

  // ================= Student Status =================

  let status = "Normal";

  if (student.riskStatus === "At Risk") {
    status = "At Risk";
  } else if (
    student.attendance < 75 ||
    student.cgpa < 7
  ) {
    status = "Warning";
  }

  // ================= Marks Form =================

  const resetMarkForm = () => {
    setMarkForm({
      subjectId: "",
      internalMarks: "",
      externalMarks: "",
    });

    setEditingMark(null);
  };

  const openAddMarksForm = () => {
    resetMarkForm();
    setShowMarksForm(true);
  };

  const openEditMarksForm = (mark) => {
    setEditingMark(mark);

    setMarkForm({
      subjectId: mark.subjectRef || "",
      internalMarks: mark.internalMarks ?? "",
      externalMarks: mark.externalMarks ?? "",
    });

    setShowMarksForm(true);
  };

  // Subjects the student can be graded in: current + earlier semesters,
  // and only those that do not have marks yet (unless we are editing).
  const markedSubjectIds = marks.map((m) => m.subjectRef);

  const subjectsForMarks = subjects.filter(
    (subject) =>
      subject.semester <= (student?.semester || 0) &&
      (editingMark || !markedSubjectIds.includes(subject._id))
  );

  const selectedSubject = subjects.find(
    (subject) => subject._id === markForm.subjectId
  );

  // Same idea for attendance
  const attendedSubjectIds = attendanceRecords.map((a) => a.subjectRef);

  const subjectsForAttendance = subjects.filter(
    (subject) =>
      subject.semester <= (student?.semester || 0) &&
      (editingAttendance || !attendedSubjectIds.includes(subject._id))
  );

  const selectedAttendanceSubject = subjects.find(
    (subject) => subject._id === attendanceForm.subjectId
  );

  const closeMarksForm = () => {
    if (savingMark) return;

    setShowMarksForm(false);
    resetMarkForm();
  };

  const handleMarkChange = (e) => {
    const { name, value } = e.target;

    setMarkForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ================= Save / Update Marks =================

  const handleSaveMarks = async (e) => {
    e.preventDefault();

    if (!markForm.subjectId) {
      alert("Please select a subject.");
      return;
    }

    if (
      markForm.internalMarks === "" ||
      markForm.externalMarks === ""
    ) {
      alert("Please enter internal and external marks.");
      return;
    }

    const internalMarks = Number(markForm.internalMarks);
    const externalMarks = Number(markForm.externalMarks);

    if (
      internalMarks < 0 ||
      internalMarks > selectedSubject.internalMax
    ) {
      alert(
        `Internal marks must be between 0 and ${selectedSubject.internalMax}.`
      );
      return;
    }

    if (
      externalMarks < 0 ||
      externalMarks > selectedSubject.externalMax
    ) {
      alert(
        `External marks must be between 0 and ${selectedSubject.externalMax}.`
      );
      return;
    }

    try {
      setSavingMark(true);

      const token = localStorage.getItem("trackwiseToken");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      // Subject name, code, semester, max marks and grade are all
      // filled in by the server from the admin's subject catalog.
      const payload = {
        student: studentId,
        subjectId: markForm.subjectId,
        internalMarks,
        externalMarks,
      };

      const response = await fetch(
        editingMark
          ? `http://localhost:5000/api/marks/${editingMark._id}`
          : "http://localhost:5000/api/marks",
        {
          method: editingMark ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(
          editingMark
            ? "Marks updated successfully!"
            : "Marks added successfully!"
        );

        setShowMarksForm(false);
        resetMarkForm();

        await fetchMarks();
      } else {
        alert(data.message || "Unable to save marks.");
      }
    } catch (error) {
      console.error("Error saving marks:", error);

      alert("Unable to connect to the server.");
    } finally {
      setSavingMark(false);
    }
  };

  // ================= Save Notes =================

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);

      const token = localStorage.getItem("trackwiseToken");

      const response = await fetch(
        `http://localhost:5000/api/students/${studentId}/notes`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notes: notesDraft ?? student.mentorNotes ?? "" }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setStudent({ ...student, mentorNotes: data.notes });
        setNotesDraft(null);
        alert("Notes saved.");
      } else {
        alert(data.message || "Unable to save notes.");
      }
    } catch (error) {
      console.error("Error saving notes:", error);
      alert("Unable to connect to the server.");
    } finally {
      setSavingNotes(false);
    }
  };

  // ================= Export report (CSV) =================

  const handleExportReport = () => {
    // Cells starting with = + - @ are prefixed so spreadsheets never run them as formulas
    const cell = (value) => {
      let text = String(value ?? "");
      if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = [
      ["Student Report"],
      ["Name", student.fullName],
      ["Roll Number", student.rollNumber],
      ["Course", student.course?.name || student.department],
      ["Semester", student.semester],
      ["CGPA", student.cgpa],
      ["Overall Attendance %", student.attendance],
      ["Risk Status", student.riskStatus],
      [],
      ["Marks"],
      ["Semester", "Code", "Subject", "Internal", "External", "Total", "Max", "Grade"],
      ...marks.map((m) => [m.semester, m.subjectCode, m.subject, m.internalMarks, m.externalMarks, m.totalMarks, m.totalMax, m.grade]),
      [],
      ["Attendance"],
      ["Semester", "Code", "Subject", "Attended", "Total", "%"],
      ...attendanceRecords.map((a) => [
        a.semester,
        a.subjectCode,
        a.subject,
        a.attendedClasses,
        a.totalClasses,
        a.totalClasses ? Math.round((a.attendedClasses / a.totalClasses) * 100) : 0,
      ]),
    ];

    const csv = rows.map((row) => row.map(cell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${student.rollNumber.replace(/[^a-z0-9]/gi, "_")}-report.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  // ================= Attendance Form =================

  const openAddAttendanceForm = () => {
    setEditingAttendance(null);
    setAttendanceForm({
      subjectId: "",
      totalClasses: "",
      attendedClasses: "",
    });
    setShowAttendanceForm(true);
  };

  const openEditAttendanceForm = (record) => {
    setEditingAttendance(record);
    setAttendanceForm({
      subjectId: record.subjectRef || "",
      totalClasses: record.totalClasses,
      attendedClasses: record.attendedClasses,
    });
    setShowAttendanceForm(true);
  };

  const closeAttendanceForm = () => {
    if (savingAttendance) return;
    setShowAttendanceForm(false);
    setEditingAttendance(null);
  };

  const handleSaveAttendance = async (e) => {
    e.preventDefault();

    if (!attendanceForm.subjectId) {
      alert("Please select a subject.");
      return;
    }

    const totalClasses = Number(attendanceForm.totalClasses);
    const attendedClasses = Number(attendanceForm.attendedClasses);

    if (
      attendanceForm.totalClasses === "" ||
      attendanceForm.attendedClasses === ""
    ) {
      alert("Please enter total and attended classes.");
      return;
    }

    if (attendedClasses > totalClasses) {
      alert("Attended classes cannot be more than total classes.");
      return;
    }

    try {
      setSavingAttendance(true);

      const token = localStorage.getItem("trackwiseToken");

      const response = await fetch(
        editingAttendance
          ? `http://localhost:5000/api/attendance/${editingAttendance._id}`
          : "http://localhost:5000/api/attendance",
        {
          method: editingAttendance ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            student: studentId,
            subjectId: attendanceForm.subjectId,
            totalClasses,
            attendedClasses,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setShowAttendanceForm(false);
        setEditingAttendance(null);

        await fetchAttendance();
        await refreshStudent();
      } else {
        alert(data.message || "Unable to save attendance.");
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Unable to connect to the server.");
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleDeleteAttendance = async (attendanceId) => {
    if (!window.confirm("Delete this attendance record?")) return;

    try {
      const token = localStorage.getItem("trackwiseToken");

      const response = await fetch(
        `http://localhost:5000/api/attendance/${attendanceId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (response.ok) {
        await fetchAttendance();
        await refreshStudent();
      } else {
        alert(data.message || "Unable to delete attendance.");
      }
    } catch (error) {
      console.error("Error deleting attendance:", error);
      alert("Unable to connect to the server.");
    }
  };

  // Re-fetch the student so the overall attendance % updates
  async function refreshStudent() {
    try {
      const token = localStorage.getItem("trackwiseToken");

      const response = await fetch(
        `http://localhost:5000/api/students/${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();

      if (response.ok) {
        setStudent(data.student);
      }
    } catch (error) {
      console.error("Error refreshing student:", error);
    }
  }

  // ================= Delete Marks =================

  const handleDeleteMark = async (markId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete these marks?"
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("trackwiseToken");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/marks/${markId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Marks deleted successfully!");

        setMarks((previousMarks) =>
          previousMarks.filter(
            (mark) => mark._id !== markId
          )
        );
      } else {
        alert(
          data.message ||
            "Unable to delete marks."
        );
      }
    } catch (error) {
      console.error("Error deleting marks:", error);

      alert("Unable to connect to the server.");
    }
  };

  // ================= Marks Statistics =================

  const totalSubjects = marks.length;

  const totalObtained = marks.reduce(
    (sum, mark) =>
      sum + Number(mark.totalMarks || 0),
    0
  );

  const totalPossible = marks.reduce(
    (sum, mark) =>
      sum + Number(mark.totalMax || 0),
    0
  );

  const overallPercentage =
    totalPossible > 0
      ? ((totalObtained / totalPossible) * 100).toFixed(1)
      : "0.0";

  // ================= Main UI =================

  return (
    <div className="student-profile-page">

      {/* ================= Sidebar ================= */}

      <aside className="mentor-sidebar">

        <div className="mentor-logo">
          <h2>TrackWise</h2>
        </div>

        <ul className="mentor-menu">

          <li>
            <Link
              to="/mentor-dashboard"
              className="mentor-menu-link"
            >
              <FaHome />
              <span>Dashboard</span>
            </Link>
          </li>

          <li>
            <Link
              to="/my-mentees"
              className="mentor-menu-link"
            >
              <FaUsers />
              <span>My Mentees</span>
            </Link>
          </li>

          <li>
            <Link
              to="/at-risk"
              className="mentor-menu-link"
            >
              <FaExclamationTriangle />
              <span>At Risk Students</span>
            </Link>
          </li>

          <li>
            <Link
              to="/meetings"
              className="mentor-menu-link"
            >
              <FaCalendarAlt />
              <span>Meetings</span>
            </Link>
          </li>

          <li>
            <Link
              to="/bulk-alerts"
              className="mentor-menu-link"
            >
              <FaBell />
              <span>Bulk Alerts</span>
            </Link>
          </li>

          <li>
            <Link
              to="/reports"
              className="mentor-menu-link"
            >
              <FaChartBar />
              <span>Reports</span>
            </Link>
          </li>

          <li>
            <Link
              to="/profile"
              className="mentor-menu-link"
            >
              <FaUserCircle />
              <span>Profile</span>
            </Link>
          </li>

        </ul>

        <button
          className="mentor-logout-btn"
          onClick={handleLogout}
        >
          <FaSignOutAlt />

          <span style={{ marginLeft: "8px" }}>
            Logout
          </span>
        </button>

      </aside>

      {/* ================= Main ================= */}

      <main className="student-main">

        <Link
          to="/my-mentees"
          className="student-back"
        >
          ← Back to Mentees
        </Link>

        <h1>Student Profile</h1>

        <p className="student-subtitle">
          View complete academic information of your mentee.
        </p>

        {/* ================= Profile Card ================= */}

        <div className="student-profile-card">

          <img
            src="https://i.pravatar.cc/120?img=5"
            alt={student.fullName}
          />

          <div>

            <h2>
              {student.fullName}

              <span className="student-status">
                Active
              </span>
            </h2>

            <p>
              {student.rollNumber}
            </p>

            <p>
              {student.department}
            </p>

            <p>
              Semester {student.semester}
            </p>

            <p>
              Email : {student.email}
            </p>

            <p>
              Mentor :{" "}
              {student.mentor?.fullName ||
                "Not assigned"}
            </p>

          </div>

        </div>

        {/* ================= Summary Cards ================= */}

        <div className="student-summary-grid">

          <div className="student-summary-card">

            <FaGraduationCap className="summary-icon purple" />

            <h2>
              {student.cgpa}
            </h2>

            <p>
              Current CGPA
            </p>

          </div>

          <div className="student-summary-card">

            <FaUsers className="summary-icon green" />

            <h2>
              {student.attendance}%
            </h2>

            <p>
              Attendance
            </p>

          </div>

          <div className="student-summary-card">

            <FaBookOpen className="summary-icon blue" />

            <h2>
              {totalSubjects}
            </h2>

            <p>
              Subjects with Marks
            </p>

          </div>

          <div className="student-summary-card">

            <FaExclamationTriangle className="summary-icon orange" />

            <h2>
              {status}
            </h2>

            <p>
              Risk Status
            </p>

          </div>

        </div>

        {/* ================= Tabs ================= */}

        <div className="student-tabs">
          {[
            ["overview", "Overview"],
            ["marks", "Marks"],
            ["attendance", "Attendance"],
            ["cgpa", "CGPA Trend"],
            ["credits", "Credit Status"],
            ["backlogs", "Backlogs"],
            ["risk", "Risk Flags"],
            ["meetings", "Meeting History"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={activeTab === id ? "student-tab-active" : ""}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "marks" && (
<>
{/* ================= Marks Management ================= */}

        <div className="student-box" style={{ marginTop: "25px" }}>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >

            <div>
              <h3 style={{ marginBottom: "5px" }}>
                Marks Management
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#777",
                  fontSize: "13px",
                }}
              >
                Add and manage subject-wise marks for this student.
              </p>
            </div>

            <button
              onClick={openAddMarksForm}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "10px 16px",
                border: "none",
                borderRadius: "8px",
                background: "#2864e8",
                color: "#fff",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              <FaPlus />
              Add Marks
            </button>

          </div>

          {/* Marks Statistics */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "12px",
              marginBottom: "20px",
            }}
          >

            <div
              style={{
                background: "#f3f6fb",
                padding: "15px",
                borderRadius: "10px",
              }}
            >
              <small>Total Subjects</small>
              <h2 style={{ margin: "5px 0 0" }}>
                {totalSubjects}
              </h2>
            </div>

            <div
              style={{
                background: "#f3f6fb",
                padding: "15px",
                borderRadius: "10px",
              }}
            >
              <small>Total Marks</small>
              <h2 style={{ margin: "5px 0 0" }}>
                {totalObtained}/{totalPossible}
              </h2>
            </div>

            <div
              style={{
                background: "#f3f6fb",
                padding: "15px",
                borderRadius: "10px",
              }}
            >
              <small>Overall Percentage</small>
              <h2 style={{ margin: "5px 0 0" }}>
                {overallPercentage}%
              </h2>
            </div>

          </div>

          {/* Marks Table */}

          {marksLoading ? (
            <p>Loading marks...</p>
          ) : marks.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "35px 20px",
                background: "#f8fafc",
                borderRadius: "10px",
              }}
            >
              <FaBookOpen
                style={{
                  fontSize: "35px",
                  marginBottom: "10px",
                  opacity: 0.6,
                }}
              />

              <h3>
                No Marks Added
              </h3>

              <p
                style={{
                  color: "#777",
                  fontSize: "14px",
                }}
              >
                Click "Add Marks" to enter this student's marks.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>

              <table
                className="student-table"
                style={{ minWidth: "850px" }}
              >

                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Code</th>
                    <th>Semester</th>
                    <th>Internal</th>
                    <th>External</th>
                    <th>Total</th>
                    <th>Grade</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {marks.map((mark) => (
                    <tr key={mark._id}>

                      <td>
                        <strong>
                          {mark.subject}
                        </strong>
                      </td>

                      <td>
                        {mark.subjectCode || "-"}
                      </td>

                      <td>
                        {mark.semester}
                      </td>

                      <td>
                        {mark.internalMarks}/
                        {mark.internalMax}
                      </td>

                      <td>
                        {mark.externalMarks}/
                        {mark.externalMax}
                      </td>

                      <td>
                        <strong>
                          {mark.totalMarks}/
                          {mark.totalMax}
                        </strong>
                      </td>

                      <td>
                        <span
                          style={{
                            fontWeight: "700",
                            padding: "5px 10px",
                            borderRadius: "6px",
                            background: "#eef2ff",
                          }}
                        >
                          {mark.grade}
                        </span>
                      </td>

                      <td>

                        <div
                          style={{
                            display: "flex",
                            gap: "7px",
                          }}
                        >

                          <button
                            onClick={() =>
                              openEditMarksForm(mark)
                            }
                            title="Edit Marks"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "7px 10px",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                            }}
                          >
                            <FaEdit />
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              handleDeleteMark(mark._id)
                            }
                            title="Delete Marks"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "7px 10px",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              color: "#dc2626",
                            }}
                          >
                            <FaTrash />
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

        
</>
)}

{activeTab === "overview" && (
<>
{/* ================= Overview ================= */}

        <div className="student-overview">

          <div className="student-box">

            <h3>
              Academic Overview
            </h3>

            <table className="student-table">

              <tbody>


                <tr>
                  <td>Roll Number</td>
                  <td>{student.rollNumber}</td>
                </tr>

                <tr>
                  <td>Department</td>
                  <td>{student.course?.name || student.department || "Not set"}</td>
                </tr>

                <tr>
                  <td>Semester</td>
                  <td>{student.semester}</td>
                </tr>


                <tr>
                  <td>Email</td>
                  <td>{student.email}</td>
                </tr>


              </tbody>

            </table>

          </div>

          <div className="student-box">

            <h3>
              Performance Snapshot
            </h3>

            <div
              style={{
                padding: "40px",
                textAlign: "center",
                fontSize: "20px",
              }}
            >

              <FaGraduationCap
                style={{
                  fontSize: "45px",
                  marginBottom: "15px",
                }}
              />

              <h2>
                Current CGPA: {student.cgpa}
              </h2>

              <p>
                Attendance: {student.attendance}%
              </p>

              <p>
                Marks Percentage: {overallPercentage}%
              </p>

            </div>

          </div>

        </div>

        
{/* ================= Mentor Notes ================= */}

        <div className="student-box student-notes">

          <h3>
            Mentor Notes
          </h3>

          <textarea
            placeholder="Write mentor notes here..."
            rows="5"
            maxLength={5000}
            value={notesDraft ?? student.mentorNotes ?? ""}
            onChange={(e) => setNotesDraft(e.target.value)}
          />

          <button
            className="student-btn"
            onClick={handleSaveNotes}
            disabled={savingNotes || notesDraft === null}
          >
            {savingNotes ? "Saving..." : "Save Notes"}
          </button>

        </div>

        {/* ================= Action Buttons ================= */}

        <div className="student-action-buttons">

          <button
            className="student-primary-btn"
            onClick={() => navigate("/meetings")}
          >
            Schedule Meeting
          </button>

          <button
            className="student-secondary-btn"
            onClick={() => navigate("/bulk-alerts")}
          >
            Send Alert
          </button>

          <button
            className="student-secondary-btn"
            onClick={handleExportReport}
          >
            Export Report
          </button>

        </div>

        
</>
)}

{activeTab === "attendance" && (
<>
{/* ================= Attendance ================= */}

        <div className="student-bottom-grid">

          <div className="student-box">

            <h3>
              Subject-wise Attendance
            </h3>

            <div className="student-subject">

              <span>
                Overall Attendance
              </span>

              <progress
                value={student.attendance}
                max="100"
              />

              <small>
                {student.attendance}%
              </small>

            </div>

            {attendanceRecords.map((record) => {
              const percent = record.totalClasses
                ? Math.round(
                    (record.attendedClasses /
                      record.totalClasses) *
                      100
                  )
                : 0;

              return (
                <div
                  className="student-subject"
                  key={record._id}
                >

                  <span>
                    {record.subject}
                    {record.subjectCode
                      ? ` (${record.subjectCode})`
                      : ""}
                    {" • Sem "}
                    {record.semester}
                  </span>

                  <progress value={percent} max="100" />

                  <small>
                    {record.attendedClasses}/{record.totalClasses} ({percent}%)
                    {" "}
                    <FaEdit
                      style={{ cursor: "pointer" }}
                      title="Edit"
                      onClick={() =>
                        openEditAttendanceForm(record)
                      }
                    />
                    {" "}
                    <FaTrash
                      style={{ cursor: "pointer" }}
                      title="Delete"
                      onClick={() =>
                        handleDeleteAttendance(record._id)
                      }
                    />
                  </small>

                </div>
              );
            })}

            {attendanceRecords.length === 0 && (
              <p style={{ color: "#777" }}>
                No subject-wise attendance entered yet.
              </p>
            )}

            <button
              className="student-btn"
              onClick={openAddAttendanceForm}
              disabled={!student.course}
            >
              <FaPlus /> Add Attendance
            </button>

          </div>


          <div className="student-box">

            <h3>
              Recent Meeting
            </h3>

            <p>
              <b>Date:</b> No meeting recorded
            </p>

            <p style={{ marginTop: "12px" }}>
              Meeting history will appear here once meetings
              are added to the system.
            </p>

            <button className="student-btn">
              View Meeting History
            </button>

          </div>

        </div>

        
</>
)}

{activeTab === "cgpa" && (
          <div className="student-box">
            <h3>CGPA Trend</h3>

            {!summary || summary.semesterGpa.length === 0 ? (
              <p>No marks entered yet.</p>
            ) : (
              <table className="student-table">
                <tbody>
                  {summary.semesterGpa.map((item) => (
                    <tr key={item.semester}>
                      <td>Semester {item.semester}</td>
                      <td>SGPA {item.sgpa.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td><b>Current CGPA</b></td>
                    <td><b>{summary.cgpa.toFixed(2)}</b></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "credits" && (
          <div className="student-box">
            <h3>Credit Summary</h3>

            {(() => {
              const total = subjects.reduce((t, x) => t + (x.credits || 0), 0);
              const earned = summary ? summary.earnedCredits : 0;

              return (
                <>
                  <div className="student-credit-circle">
                    <h2>{earned}</h2>
                    <span>{total > 0 ? `/${total}` : ""}</span>
                  </div>

                  <p className="student-credit-text">
                    {total > 0
                      ? `${Math.round((earned / total) * 100)}% credits completed`
                      : "Admin has not added subjects for this course yet"}
                  </p>
                </>
              );
            })()}
          </div>
        )}

        {activeTab === "backlogs" && (
          <div className="student-box">
            <h3>Backlogs</h3>

            {marks.filter((m) => m.grade === "F").length === 0 ? (
              <p>✓ No backlogs</p>
            ) : (
              <table className="student-table">
                <tbody>
                  {marks
                    .filter((m) => m.grade === "F")
                    .map((m) => (
                      <tr key={m._id}>
                        <td>{m.subject} ({m.subjectCode})</td>
                        <td>Semester {m.semester}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "risk" && (
          <div className="student-box">
            <h3>Risk Flags</h3>

            <ul className="student-risk-list">
              {summary && summary.flags.length > 0 ? (
                summary.flags.map((flag) => <li key={flag}>⚠ {flag}</li>)
              ) : (
                <li>✓ No major risk flags</li>
              )}
            </ul>
          </div>
        )}

        {activeTab === "meetings" && (
          <div className="student-box">
            <h3>Meeting History</h3>

            {studentMeetings.length === 0 ? (
              <p>No meetings scheduled with this student yet.</p>
            ) : (
              <table className="student-table">
                <tbody>
                  {studentMeetings.map((m) => (
                    <tr key={m._id}>
                      <td>{m.title}</td>
                      <td>
                        {new Date(m.date).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td>{m.mode}</td>
                      <td>{m.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ================= Footer ================= */}

        <div className="student-footer">
          © 2026 TrackWise Mentor Portal. All Rights Reserved.
        </div>

      </main>

      {/* =====================================================
          ADD / EDIT MARKS MODAL
      ===================================================== */}

      {showMarksForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >

          <div
            style={{
              width: "650px",
              maxWidth: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: "14px",
              padding: "28px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >

            {/* Modal Header */}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >

              <div>

                <h2 style={{ margin: 0 }}>
                  {editingMark
                    ? "Edit Marks"
                    : "Add Marks"}
                </h2>

                <p
                  style={{
                    margin: "5px 0 0",
                    color: "#777",
                    fontSize: "13px",
                  }}
                >
                  {student.fullName}
                </p>

              </div>

              <button
                onClick={closeMarksForm}
                disabled={savingMark}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                <FaTimes />
              </button>

            </div>

            {/* Form */}

            <form onSubmit={handleSaveMarks}>

              {/* Subject (from the admin's catalog) */}

              <div style={{ marginBottom: "16px" }}>

                <label
                  style={{
                    display: "block",
                    fontWeight: "600",
                    marginBottom: "7px",
                  }}
                >
                  Subject *
                </label>

                {!student.course ? (
                  <p style={{ color: "#b45309", margin: 0 }}>
                    The admin has not assigned a course to this student yet.
                  </p>
                ) : (
                  <select
                    name="subjectId"
                    value={markForm.subjectId}
                    onChange={handleMarkChange}
                    disabled={savingMark || Boolean(editingMark)}
                    required
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "11px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                    }}
                  >
                    <option value="">Select subject</option>

                    {subjectsForMarks.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        Sem {subject.semester} – {subject.code} – {subject.name}
                      </option>
                    ))}
                  </select>
                )}

                {student.course && subjectsForMarks.length === 0 && (
                  <small style={{ color: "#777" }}>
                    No subjects left. Marks are added for every subject of
                    semesters 1 to {student.semester}, or the admin has not
                    added subjects yet.
                  </small>
                )}

              </div>

              {/* Internal */}

              <div
                style={{
                  background: "#f8fafc",
                  padding: "16px",
                  borderRadius: "10px",
                  marginBottom: "16px",
                }}
              >

                <h4 style={{ marginTop: 0 }}>
                  Internal Marks
                </h4>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: "15px",
                  }}
                >

                  <div>

                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        marginBottom: "6px",
                      }}
                    >
                      Obtained Marks
                    </label>

                    <input
                      type="number"
                      name="internalMarks"
                      min="0"
                      value={markForm.internalMarks}
                      onChange={handleMarkChange}
                      disabled={savingMark}
                      required
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "11px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                      }}
                    />

                  </div>

                  <div>

                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        marginBottom: "6px",
                      }}
                    >
                      Maximum Marks
                    </label>

                    <input
                      type="number"
                      name="internalMax"
                      min="1"
                      value={selectedSubject ? selectedSubject.internalMax : ""}
                      readOnly
                      onChange={handleMarkChange}
                      disabled={savingMark}
                      required
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "11px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                      }}
                    />

                  </div>

                </div>

              </div>

              {/* External */}

              <div
                style={{
                  background: "#f8fafc",
                  padding: "16px",
                  borderRadius: "10px",
                  marginBottom: "16px",
                }}
              >

                <h4 style={{ marginTop: 0 }}>
                  External Marks
                </h4>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: "15px",
                  }}
                >

                  <div>

                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        marginBottom: "6px",
                      }}
                    >
                      Obtained Marks
                    </label>

                    <input
                      type="number"
                      name="externalMarks"
                      min="0"
                      value={markForm.externalMarks}
                      onChange={handleMarkChange}
                      disabled={savingMark}
                      required
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "11px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                      }}
                    />

                  </div>

                  <div>

                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        marginBottom: "6px",
                      }}
                    >
                      Maximum Marks
                    </label>

                    <input
                      type="number"
                      name="externalMax"
                      min="1"
                      value={selectedSubject ? selectedSubject.externalMax : ""}
                      readOnly
                      onChange={handleMarkChange}
                      disabled={savingMark}
                      required
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "11px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                      }}
                    />

                  </div>

                </div>

              </div>

              {/* Grade (automatic) */}

              <p
                style={{
                  margin: "0 0 20px",
                  color: "#777",
                  fontSize: "13px",
                }}
              >
                Grade is calculated automatically from the total marks.
              </p>

              {/* Total Preview */}

              <div
                style={{
                  background: "#eef4ff",
                  padding: "14px",
                  borderRadius: "9px",
                  marginBottom: "20px",
                  fontSize: "14px",
                }}
              >

                <strong>
                  Total:
                </strong>{" "}

                {markForm.internalMarks !== "" &&
                markForm.externalMarks !== ""
                  ? Number(markForm.internalMarks) +
                    Number(markForm.externalMarks)
                  : 0}

                {" / "}

                {selectedSubject
                  ? selectedSubject.internalMax +
                    selectedSubject.externalMax
                  : 0}

              </div>

              {/* Buttons */}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >

                <button
                  type="button"
                  onClick={closeMarksForm}
                  disabled={savingMark}
                  style={{
                    padding: "10px 18px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingMark}
                  style={{
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#2864e8",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  {savingMark
                    ? "Saving..."
                    : editingMark
                    ? "Update Marks"
                    : "Save Marks"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {showAttendanceForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "480px",
              maxWidth: "100%",
              background: "#fff",
              borderRadius: "14px",
              padding: "28px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <div>
                <h2 style={{ margin: 0 }}>
                  {editingAttendance
                    ? "Edit Attendance"
                    : "Add Attendance"}
                </h2>
                <p
                  style={{
                    margin: "5px 0 0",
                    color: "#777",
                    fontSize: "13px",
                  }}
                >
                  {student.fullName}
                </p>
              </div>

              <button
                onClick={closeAttendanceForm}
                disabled={savingAttendance}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSaveAttendance}>

              <label
                style={{
                  display: "block",
                  fontWeight: "600",
                  marginBottom: "7px",
                }}
              >
                Subject *
              </label>

              <select
                value={attendanceForm.subjectId}
                onChange={(e) =>
                  setAttendanceForm({
                    ...attendanceForm,
                    subjectId: e.target.value,
                  })
                }
                disabled={
                  savingAttendance || Boolean(editingAttendance)
                }
                required
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "11px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  marginBottom: "16px",
                }}
              >
                <option value="">Select subject</option>

                {subjectsForAttendance.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    Sem {subject.semester} – {subject.code} – {subject.name}
                  </option>
                ))}
              </select>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: "600",
                      marginBottom: "7px",
                    }}
                  >
                    Total Classes *
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={attendanceForm.totalClasses}
                    onChange={(e) =>
                      setAttendanceForm({
                        ...attendanceForm,
                        totalClasses: e.target.value,
                      })
                    }
                    disabled={savingAttendance}
                    required
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "11px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: "600",
                      marginBottom: "7px",
                    }}
                  >
                    Classes Attended *
                  </label>

                  <input
                    type="number"
                    min="0"
                    max={attendanceForm.totalClasses || undefined}
                    value={attendanceForm.attendedClasses}
                    onChange={(e) =>
                      setAttendanceForm({
                        ...attendanceForm,
                        attendedClasses: e.target.value,
                      })
                    }
                    disabled={savingAttendance}
                    required
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "11px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                    }}
                  />
                </div>
              </div>

              {selectedAttendanceSubject &&
                Number(attendanceForm.totalClasses) > 0 && (
                  <div
                    style={{
                      background: "#eef4ff",
                      padding: "12px",
                      borderRadius: "9px",
                      marginBottom: "18px",
                      fontSize: "14px",
                    }}
                  >
                    <strong>Attendance:</strong>{" "}
                    {Math.round(
                      (Number(attendanceForm.attendedClasses || 0) /
                        Number(attendanceForm.totalClasses)) *
                        100
                    )}
                    %
                  </div>
                )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                }}
              >
                <button
                  type="button"
                  onClick={closeAttendanceForm}
                  disabled={savingAttendance}
                  style={{
                    padding: "10px 20px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingAttendance}
                  style={{
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#2864e8",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  {savingAttendance
                    ? "Saving..."
                    : editingAttendance
                    ? "Update Attendance"
                    : "Save Attendance"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default StudentProfile;
