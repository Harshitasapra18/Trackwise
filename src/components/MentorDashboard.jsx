import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./MentorDashboard.css";

import {
  FaHome,
  FaUsers,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaBell,
  FaChartBar,
  FaUserCircle,
  FaSignOutAlt,
} from "react-icons/fa";

function MentorDashboard() {
  const navigate = useNavigate();

  // ================= State =================

  const [students, setStudents] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doneTasks, setDoneTasks] = useState([]);

  const mentorName =
    JSON.parse(localStorage.getItem("trackwiseUser") || "{}").fullName ||
    "Mentor";

  // ================= Logout =================

  const handleLogout = () => {
    localStorage.removeItem("trackwiseToken");
    localStorage.removeItem("trackwiseUser");

    navigate("/login", { replace: true });
  };

  // ================= Fetch Students =================

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem("trackwiseToken");

        const response = await fetch(
          "http://localhost:5000/api/students",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          setStudents(data.students || []);
        } else {
          console.error(data.message);
        }

      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchMeetings = async () => {
      try {
        const token = localStorage.getItem("trackwiseToken");

        const response = await fetch("http://localhost:5000/api/meetings", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (response.ok) {
          setMeetings(data.meetings || []);
        }
      } catch (error) {
        console.error("Error fetching meetings:", error);
      }
    };

    fetchStudents();
    fetchMeetings();
  }, []);

  // ================= Dashboard Calculations =================

  const totalMentees = students.length;

  const atRiskStudents = students.filter(
    (student) => student.riskStatus === "At Risk"
  ).length;

  const averageCGPA =
    students.length > 0
      ? (
          students.reduce(
            (total, student) => total + student.cgpa,
            0
          ) / students.length
        ).toFixed(2)
      : "0.00";

  const averageAttendance =
    students.length > 0
      ? (
          students.reduce(
            (total, student) => total + student.attendance,
            0
          ) / students.length
        ).toFixed(0)
      : "0";

  // ================= Meetings (real data) =================

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7)); // Monday
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const meetingsThisWeek = meetings.filter((m) => {
    const d = new Date(m.date);
    return m.status !== "Cancelled" && d >= weekStart && d < weekEnd;
  }).length;

  const pastMeetings = meetings.filter(
    (m) =>
      m.status !== "Cancelled" &&
      (m.status === "Completed" || new Date(m.date) <= now)
  );

  const completedMeetings = pastMeetings.filter(
    (m) => m.status === "Completed"
  ).length;

  const meetingCompletion =
    pastMeetings.length > 0
      ? Math.round((completedMeetings / pastMeetings.length) * 100)
      : 0;

  const upcomingMeetings = meetings.filter(
    (m) =>
      (m.status === "Scheduled" || m.status === "Pending") &&
      new Date(m.date) > now
  ).length;

  const pendingMeetings = meetings.filter(
    (m) => m.status === "Pending"
  ).length;

  // ================= Alert counts (0 means "no data yet") =================

  const lowAttendanceCount = students.filter(
    (st) => st.attendance > 0 && st.attendance < 75
  ).length;

  const lowCgpaCount = students.filter(
    (st) => st.cgpa > 0 && st.cgpa < 6.5
  ).length;

  // ================= Follow-up tasks generated from the data =================

  const studentsWithUpcomingMeeting = new Set(
    meetings
      .filter(
        (m) =>
          (m.status === "Scheduled" || m.status === "Pending") &&
          new Date(m.date) > now
      )
      .map((m) => String(m.student?._id || m.student))
  );

  const tasks = [
    ...students
      .filter((st) => st.riskStatus === "At Risk")
      .map((st) => ({
        id: `review-${st._id}`,
        text: `Review ${st.fullName}'s progress report`,
      })),
    ...students
      .filter((st) => !studentsWithUpcomingMeeting.has(String(st._id)))
      .map((st) => ({
        id: `meet-${st._id}`,
        text: `Schedule a meeting with ${st.fullName}`,
      })),
  ].slice(0, 6);

  const toggleTask = (id) =>
    setDoneTasks((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );

  // ================= Main UI =================

  return (
    <div className="mentor-dashboard">

      {/* ================= Sidebar ================= */}

      <aside className="mentor-sidebar">

        <div>

          <div className="mentor-logo">
            <h2>TrackWise</h2>
          </div>

          <ul className="mentor-menu">

            {/* Dashboard */}

            <li>
              <Link
                to="/mentor-dashboard"
                className="mentor-menu-link mentor-active"
              >
                <FaHome />
                <span>Dashboard</span>
              </Link>
            </li>

            {/* My Mentees */}

            <li>
              <Link
                to="/my-mentees"
                className="mentor-menu-link"
              >
                <FaUsers />
                <span>My Mentees</span>
              </Link>
            </li>

            {/* At Risk Students */}

            <li>
              <Link
                to="/at-risk"
                className="mentor-menu-link"
              >
                <FaExclamationTriangle />
                <span>At Risk Students</span>
              </Link>
            </li>

            {/* Meetings */}

            <li>
              <Link
                to="/meetings"
                className="mentor-menu-link"
              >
                <FaCalendarAlt />
                <span>Meetings</span>
              </Link>
            </li>

            {/* Bulk Alerts */}

            <li>
              <Link
                to="/bulk-alerts"
                className="mentor-menu-link"
              >
                <FaBell />
                <span>Bulk Alerts</span>
              </Link>
            </li>

            {/* Reports */}

            <li>
              <Link
                to="/reports"
                className="mentor-menu-link"
              >
                <FaChartBar />
                <span>Reports</span>
              </Link>
            </li>

            {/* Profile */}

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

        </div>

        {/* ================= Logout ================= */}

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

      <main className="mentor-main">

        {/* ================= Header ================= */}

        <div className="mentor-header">

          <div>

            <h1>
              Welcome back, {mentorName} 👋
            </h1>

            <p>
              Here's an overview of your mentees and mentoring activities.
            </p>

          </div>

          <div className="mentor-profile">

            <img
              src="https://i.pravatar.cc/80?img=12"
              alt="mentor"
            />

            <div>

              <h4>{mentorName}</h4>

              <span>Mentor</span>

            </div>

          </div>

        </div>

        {/* ================= Statistics ================= */}

        <div className="mentor-stats">

          {/* Total Mentees */}

          <div className="mentor-card mentor-blue">

            <h4>Total Mentees</h4>

            <h2>
              {loading ? "..." : totalMentees}
            </h2>

            <p>
              View all mentees →
            </p>

          </div>

          {/* At Risk Students */}

          <div className="mentor-card mentor-red">

            <h4>At Risk Students</h4>

            <h2>
              {loading ? "..." : atRiskStudents}
            </h2>

            <p>
              View details →
            </p>

          </div>

          {/* Meetings */}

          <div className="mentor-card mentor-green">

            <h4>Meetings This Week</h4>

            <h2>{loading ? "..." : meetingsThisWeek}</h2>

            <p>
              View schedule →
            </p>

          </div>

          {/* Average CGPA */}

          <div className="mentor-card mentor-purple">

            <h4>Average CGPA</h4>

            <h2>
              {loading ? "..." : averageCGPA}
            </h2>

            <p>
              View report →
            </p>

          </div>

        </div>

        {/* ================= Bottom Section ================= */}

        <div className="mentor-bottom-section">

          {/* ================= Mentor Insights ================= */}

          <div className="mentor-section-card">

            <h2>
              Mentor Insights
            </h2>

            <div className="mentor-insight-grid">

              <div className="mentor-insight-card">

                <h3>{loading ? "..." : `${meetingCompletion}%`}</h3>

                <p>
                  Meetings Completed
                </p>

              </div>

              <div className="mentor-insight-card">

                <h3>
                  {loading ? "..." : atRiskStudents}
                </h3>

                <p>
                  Students Below Target
                </p>

              </div>

              <div className="mentor-insight-card">

                <h3>{loading ? "..." : upcomingMeetings}</h3>

                <p>
                  Upcoming Meetings
                </p>

              </div>

              <div className="mentor-insight-card">

                <h3>
                  {loading ? "..." : `${averageAttendance}%`}
                </h3>

                <p>
                  Attendance Average
                </p>

              </div>

            </div>

          </div>

          {/* ================= Tasks ================= */}

          <div className="mentor-section-card">

            <h2>
              Tasks & Follow-ups
            </h2>

            <ul className="mentor-task-list">
              {tasks.length === 0 && (
                <li>
                  <span>No pending follow-ups 🎉</span>
                </li>
              )}

              {tasks.map((task) => (
                <li key={task.id}>
                  <input
                    type="checkbox"
                    checked={doneTasks.includes(task.id)}
                    onChange={() => toggleTask(task.id)}
                  />
                  <span
                    style={{
                      textDecoration: doneTasks.includes(task.id)
                        ? "line-through"
                        : "none",
                    }}
                  >
                    {task.text}
                  </span>
                </li>
              ))}
            </ul>

          </div>

          {/* ================= Alerts ================= */}

          <div className="mentor-section-card">

            <h2>
              Alert Summary
            </h2>

            {lowAttendanceCount > 0 && (
              <div className="mentor-alert mentor-alert-red">
                Attendance below 75%: {lowAttendanceCount} student(s)
              </div>
            )}

            {lowCgpaCount > 0 && (
              <div className="mentor-alert mentor-alert-orange">
                CGPA below 6.5: {lowCgpaCount} student(s)
              </div>
            )}

            {pendingMeetings > 0 && (
              <div className="mentor-alert mentor-alert-blue">
                Meeting pending: {pendingMeetings}
              </div>
            )}

            {lowAttendanceCount === 0 &&
              lowCgpaCount === 0 &&
              pendingMeetings === 0 && (
                <div className="mentor-alert mentor-alert-green">
                  Everything is on track
                </div>
              )}
          </div>
        </div>
      </main>

    </div>
  );
}

export default MentorDashboard;