import "./MenteeDashboard.css";

import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  FaHome,
  FaBook,
  FaClipboardCheck,
  FaChartLine,
  FaBullseye,
  FaUsers,
  FaBell,
  FaUserCircle,
  FaSignOutAlt,
  FaGraduationCap,
  FaCheckCircle,
  FaAward,
  FaBullseye as TargetIcon,
} from "react-icons/fa";

function MenteeDashboard() {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [student, setStudent] = useState(null);
  const [summary, setSummary] = useState(null);
  const [targets, setTargets] = useState(null);
  const [batch, setBatch] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem("trackwiseToken");
    localStorage.removeItem("trackwiseUser");

    navigate("/login", { replace: true });
  };

  // =========================================================
  // FETCH LOGGED-IN MENTEE PROFILE
  // =========================================================

  useEffect(() => {
    const fetchMenteeProfile = async () => {
      try {
        const token = localStorage.getItem("trackwiseToken");

        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/students/mentee/me",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          setStudent(data.student);
          setErrorMessage("");

          // Extra dashboard data. Each call is optional: a failure here
          // should never hide the main profile.
          const getJson = async (path) => {
            try {
              const r = await fetch(`http://localhost:5000/api${path}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              return r.ok ? await r.json() : null;
            } catch {
              return null;
            }
          };

          const [sum, meet, bat, att] = await Promise.all([
            getJson("/students/mentee/summary"),
            getJson("/meetings/mentee/me"),
            getJson("/students/mentee/batch"),
            getJson("/attendance/mentee/me"),
          ]);

          if (sum) {
            setSummary(sum.summary);
            setTargets(sum.targets);
          }
          if (meet) setMeetings(meet.meetings || []);
          if (bat) setBatch(bat);
          if (att) setAttendanceRecords(att.attendance || []);

          if (data.student.course?._id) {
            const subs = await getJson(
              `/courses/${data.student.course._id}/subjects`
            );
            if (subs) {
              setTotalCredits(
                (subs.subjects || []).reduce((t, x) => t + (x.credits || 0), 0)
              );
            }
          }
        } else {
          setErrorMessage(
            data.message || "Unable to fetch your profile."
          );

          if (response.status === 401) {
            localStorage.removeItem("trackwiseToken");
            localStorage.removeItem("trackwiseUser");

            navigate("/login", { replace: true });
          }
        }
      } catch (error) {
        console.error(
          "Error fetching mentee profile:",
          error
        );

        setErrorMessage(
          "Unable to connect to the TrackWise server."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMenteeProfile();
  }, [navigate]);

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <div className="mentee-dashboard">
        <aside className="sidebar">

          <div className="logo">
            <h2>TrackWise</h2>
          </div>

        </aside>

        <main className="main-content">
          <div
            style={{
              padding: "40px",
              fontSize: "20px",
              fontWeight: "600",
            }}
          >
            Loading your dashboard...
          </div>
        </main>
      </div>
    );
  }

  // =========================================================
  // ERROR SCREEN
  // =========================================================

  if (!student) {
    return (
      <div className="mentee-dashboard">
        <aside className="sidebar">

          <div className="logo">
            <h2>TrackWise</h2>
          </div>

          <ul className="menu">

            <li className="active">
              <Link to="/mentee-dashboard">
                <FaHome />
                Dashboard
              </Link>
            </li>

            <li>
              <Link to="/marks">
                <FaBook />
                Marks
              </Link>
            </li>

            <li>
              <Link to="/attendance">
                <FaClipboardCheck />
                Attendance
              </Link>
            </li>

            <li>
              <Link to="/cgpa-tracker">
                <FaChartLine />
                CGPA Tracker
              </Link>
            </li>

            <li>
              <Link to="/academic-target">
                <FaBullseye />
                Academic Target
              </Link>
            </li>

            <li>
              <Link to="/batch-comparison">
                <FaUsers />
                Batch Comparison
              </Link>
            </li>

            <li>
              <Link to="/alerts">
                <FaBell />
                Alerts
              </Link>
            </li>

            <li>
              <Link to="/mentee-profile">
                <FaUserCircle />
                Profile
              </Link>
            </li>

          </ul>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            <FaSignOutAlt />
            Logout
          </button>

        </aside>

        <main className="main-content">
          <div
            style={{
              padding: "40px",
              color: "#d32f2f",
            }}
          >
            <h2>Unable to load profile</h2>

            <p>
              {errorMessage ||
                "No student profile is linked to this mentee account."}
            </p>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================
  // DYNAMIC DATA
  // =========================================================

  const fullName =
    student.fullName ||
    student.user?.fullName ||
    "Student";

  const rollNumber =
    student.rollNumber || "N/A";

  const department =
    student.department || "N/A";

  const semester =
    student.semester || "N/A";

  const cgpa =
    Number(student.cgpa || 0).toFixed(2);

  const attendance =
    Number(student.attendance || 0);


  // =========================================================
  // ATTENDANCE STATUS
  // =========================================================

  const attendanceWarning =
    attendance > 0 && attendance < 75;

  // =========================================================
  // CGPA STATUS
  // =========================================================

  const cgpaWarning =
    Number(student.cgpa || 0) > 0 && Number(student.cgpa || 0) < 7;

  const earnedCredits = summary ? summary.earnedCredits : 0;
  const remainingCredits = Math.max(0, totalCredits - earnedCredits);

  const upcomingMeetings = meetings
    .filter(
      (m) =>
        (m.status === "Scheduled" || m.status === "Pending") &&
        new Date(m.date) > new Date()
    )
    .slice(0, 3);

  return (
    <div className="mentee-dashboard">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="sidebar">

        <div className="logo">
          <h2>TrackWise</h2>
        </div>

        <ul className="menu">

          <li className="active">
            <Link to="/mentee-dashboard">
              <FaHome />
              Dashboard
            </Link>
          </li>

          <li>
            <Link to="/marks">
              <FaBook />
              Marks
            </Link>
          </li>

          <li>
            <Link to="/attendance">
              <FaClipboardCheck />
              Attendance
            </Link>
          </li>

          <li>
            <Link to="/cgpa-tracker">
              <FaChartLine />
              CGPA Tracker
            </Link>
          </li>

          <li>
            <Link to="/academic-target">
              <FaBullseye />
              Academic Target
            </Link>
          </li>

          <li>
            <Link to="/batch-comparison">
              <FaUsers />
              Batch Comparison
            </Link>
          </li>

          <li>
            <Link to="/alerts">
              <FaBell />
              Alerts
            </Link>
          </li>

          <li>
            <Link to="/mentee-profile">
              <FaUserCircle />
              Profile
            </Link>
          </li>

        </ul>

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          <FaSignOutAlt />
          Logout
        </button>

      </aside>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="main-content">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="header">

          <div>

            <h1>
              Hello, {fullName} 👋
            </h1>

            <p>
              Semester {semester} • {department} • Roll No.{" "}
              {rollNumber}
            </p>

          </div>


          <div className="header-right">

            <div className="notification">

              <FaBell />

              <span>0</span>

            </div>


            <div className="profile">

              <img
                src={`https://i.pravatar.cc/60?u=${rollNumber}`}
                alt={fullName}
              />

              <div>

                <h4>
                  {fullName}
                </h4>

                <p>
                  {rollNumber}
                </p>

              </div>

            </div>

          </div>

        </div>


        {/* ===================================================
            TOP STATS
        =================================================== */}

        <div className="stats">

          {/* CGPA */}

          <div className="card">

            <div className="icon purple">
              <FaGraduationCap />
            </div>

            <div>

              <h4>CGPA</h4>

              <h2>
                {cgpa}
              </h2>

              <p>
                Current CGPA
              </p>

            </div>

          </div>


          {/* Attendance */}

          <div className="card">

            <div className="icon green">
              <FaCheckCircle />
            </div>

            <div>

              <h4>Attendance</h4>

              <h2>
                {attendance}%
              </h2>

              <p>
                Overall Attendance
              </p>

            </div>

          </div>


          {/* Credits */}

          <div className="card">

            <div className="icon blue">
              <FaAward />
            </div>

            <div>

              <h4>Earned Credits</h4>
              <h2>
                {summary ? earnedCredits : "N/A"}
              </h2>
              <p>
                {totalCredits > 0
                  ? `of ${totalCredits} total`
                  : "Credits from passed subjects"}
              </p>

            </div>

          </div>


          {/* Remaining Credits */}

          <div className="card">

            <div className="icon orange">
              <TargetIcon />
            </div>

            <div>

              <h4>Remaining Credits</h4>
              <h2>
                {totalCredits > 0 ? remainingCredits : "N/A"}
              </h2>
              <p>
                {totalCredits > 0
                  ? "Across all semesters"
                  : "Admin has not added subjects yet"}
              </p>

            </div>

          </div>

        </div>


        {/* ===================================================
            ATTENDANCE WARNING
        =================================================== */}

        {attendanceWarning && (

          <div className="warning-banner">

            <span>⚠</span>

            <div>

              <h3>
                Overall Attendance: {attendance}%
              </h3>

              <p>
                Your attendance is below the recommended
                75% threshold. Please attend your upcoming
                classes regularly.
              </p>

            </div>

          </div>

        )}


        {/* ===================================================
            ACADEMIC OVERVIEW
        =================================================== */}

        <div className="overview-grid">


          {/* =================================================
              CGPA TREND
          ================================================= */}

          <div className="box">

            <h3>
              CGPA Trend
            </h3>

            <div className="graph-placeholder">

              <h1>
                {cgpa}
              </h1>

              <p>
                Current CGPA
              </p>

              {summary && summary.semesterGpa.length > 0 ? (
                <small>
                  {summary.semesterGpa
                    .map((x) => `Sem ${x.semester}: ${x.sgpa.toFixed(2)}`)
                    .join("  •  ")}
                </small>
              ) : (
                <small>
                  Semester-wise SGPA will appear once marks are entered.
                </small>
              )}

            </div>

          </div>


          {/* =================================================
              ATTENDANCE
          ================================================= */}

          <div className="box">

            <h3>
              Attendance
            </h3>

            <div className="subject">

              <span>
                Overall Attendance
              </span>

              <div className="progress">

                <div
                  className={`progress-fill ${
                    attendance < 75
                      ? "red"
                      : attendance < 80
                      ? "yellow"
                      : "green"
                  }`}
                  style={{
                    width: `${Math.min(
                      Math.max(attendance, 0),
                      100
                    )}%`,
                  }}
                ></div>

              </div>

              <span>
                {attendance}%
              </span>

            </div>

            {attendanceRecords.length === 0 ? (
              <p
                style={{
                  marginTop: "15px",
                  fontSize: "13px",
                  color: "#777",
                }}
              >
                Your mentor has not entered subject-wise attendance yet.
              </p>
            ) : (
              <div style={{ marginTop: "15px", fontSize: "13px" }}>
                {attendanceRecords.slice(0, 5).map((r) => {
                  const p = r.totalClasses
                    ? Math.round((r.attendedClasses / r.totalClasses) * 100)
                    : 0;
                  return (
                    <div
                      key={r._id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "4px 0",
                        color: p < 75 ? "#d32f2f" : "#444",
                      }}
                    >
                      <span>{r.subject}</span>
                      <b>{p}%</b>
                    </div>
                  );
                })}
              </div>
            )}

          </div>


          {/* =================================================
              ATTENDANCE PREDICTOR
          ================================================= */}

          <div className="box">

            <h3>
              Attendance Predictor
            </h3>

            <h1>
              {attendance}%
            </h1>

            <p>
              Current Attendance
            </p>

            <button className="predict-btn">
              {attendanceWarning
                ? "Attendance needs improvement"
                : "Attendance is on track"}
            </button>

          </div>


          {/* =================================================
              ACADEMIC TARGET
          ================================================= */}

          <div className="box">

            <h3>
              Academic Target
            </h3>

            <h2>
              Target CGPA
            </h2>

            <h1>
              {targets ? targets.targetCgpa.toFixed(2) : "N/A"}
            </h1>
            <p>
              Current CGPA: {cgpa}
            </p>
            <div className="progress">
              <div
                className="progress-fill blue"
                style={{
                  width: `${
                    targets && targets.targetCgpa > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (Number(cgpa) / targets.targetCgpa) * 100
                          )
                        )
                      : 0
                  }%`,
                }}
              ></div>
            </div>
            <small>
              Change your target on the Academic Target page.
            </small>

          </div>


          {/* =================================================
              BATCH COMPARISON
          ================================================= */}

          <div className="box">

            <h3>
              Batch Comparison
            </h3>

            <div className="graph-placeholder">

              <h1>
                {cgpa}
              </h1>

              <p>
                Your CGPA
              </p>

              <small>
                {batch && batch.available
                  ? `Batch average ${batch.average.cgpa.toFixed(
                      2
                    )} • Rank #${batch.rank} of ${batch.batchSize}`
                  : "Comparison appears when your batch has at least 3 students."}
              </small>

            </div>

          </div>

        </div>


        {/* ===================================================
            BOTTOM SECTION
        =================================================== */}

        <div className="bottom-grid">


          {/* =================================================
              LATEST ALERTS
          ================================================= */}

          <div className="box">

            <h3>
              Latest Alerts
            </h3>

            {attendanceWarning && (

              <div className="alert-item">

                <span>🔴</span>

                <div>

                  <h4>
                    Attendance is below 75%
                  </h4>

                  <p>
                    Current attendance: {attendance}%
                  </p>

                </div>

              </div>

            )}


            {cgpaWarning && (

              <div className="alert-item">

                <span>🟡</span>

                <div>

                  <h4>
                    CGPA needs improvement
                  </h4>

                  <p>
                    Current CGPA: {cgpa}
                  </p>

                </div>

              </div>

            )}


            {!attendanceWarning &&
              !cgpaWarning && (

                <div className="alert-item">

                  <span>🟢</span>

                  <div>

                    <h4>
                      Academic performance is on track
                    </h4>

                    <p>
                      Keep maintaining your performance.
                    </p>

                  </div>

                </div>

              )}


            <Link to="/alerts">

              <button className="view-btn">
                View All Alerts →
              </button>

            </Link>

          </div>


          {/* =================================================
              UPCOMING TASKS
          ================================================= */}

          <div className="box">

            <h3>
              Upcoming Meetings
            </h3>

            {upcomingMeetings.length === 0 && (
              <div className="task">
                <div>
                  <h4>No upcoming meetings</h4>
                  <p>Your mentor has not scheduled one yet.</p>
                </div>
              </div>
            )}

            {upcomingMeetings.map((m) => (
              <div className="task" key={m._id}>
                <div>
                  <h4>{m.title}</h4>
                  <p>
                    {new Date(m.date).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}{" "}
                    • {m.mode}
                  </p>
                </div>
                <span className="pending">{m.status}</span>
              </div>
            ))}

            <Link to="/alerts">
              <button className="view-btn">
                View All →
              </button>
            </Link>

          </div>


          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <div className="box">

            <h3>
              Quick Actions
            </h3>

            <div className="quick-grid">

              <Link
                to="/marks"
                className="quick-card"
              >
                📖
                <p>
                  View Marks
                </p>
              </Link>


              <Link
                to="/attendance"
                className="quick-card"
              >
                📅
                <p>
                  Attendance
                </p>
              </Link>


              <Link
                to="/cgpa-tracker"
                className="quick-card"
              >
                📈
                <p>
                  CGPA Tracker
                </p>
              </Link>


              <Link
                to="/academic-target"
                className="quick-card"
              >
                🎯
                <p>
                  Academic Target
                </p>
              </Link>


              <Link
                to="/batch-comparison"
                className="quick-card"
              >
                👥
                <p>
                  Batch Comparison
                </p>
              </Link>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

export default MenteeDashboard;