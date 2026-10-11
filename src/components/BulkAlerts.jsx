import "./BulkAlerts.css";
import { Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";

import {
  FaHome,
  FaUsers,
  FaCalendarAlt,
  FaBell,
  FaChartBar,
  FaSignOutAlt,
  FaExclamationTriangle,
  FaSearch,
  FaPaperPlane,
  FaUserCircle,
} from "react-icons/fa";

function BulkAlerts() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);

  const [search, setSearch] = useState("");
  const [alertType, setAlertType] = useState("Attendance Alert");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("High");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // =====================================================
  // FETCH STUDENTS AND ALERTS
  // =====================================================

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("trackwiseToken");

      if (!token) {
        navigate("/login");
        return;
      }

      // Fetch students
      const studentsResponse = await fetch(
        "http://localhost:5000/api/students",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const studentsData = await studentsResponse.json();

      if (studentsResponse.ok) {
        setStudents(studentsData.students || []);
      } else {
        console.error(studentsData.message);
      }

      // Fetch alerts
      const alertsResponse = await fetch(
        "http://localhost:5000/api/alerts",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const alertsData = await alertsResponse.json();

      if (alertsResponse.ok) {
        setAlerts(alertsData.alerts || []);
      } else {
        console.error(alertsData.message);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("trackwiseToken");
    localStorage.removeItem("trackwiseUser");
    navigate("/login");
  };

  // =====================================================
  // SEARCH STUDENTS
  // =====================================================

  const filteredStudents = students.filter((student) => {
    const searchText = search.toLowerCase();

    return (
      student.fullName?.toLowerCase().includes(searchText) ||
      student.rollNumber?.toLowerCase().includes(searchText)
    );
  });

  // =====================================================
  // SELECT STUDENT
  // =====================================================

  const toggleStudent = (studentId) => {
    setSelectedStudents((previous) => {
      if (previous.includes(studentId)) {
        return previous.filter((id) => id !== studentId);
      }

      return [...previous, studentId];
    });
  };

  // =====================================================
  // SELECT ALL
  // =====================================================

  const toggleSelectAll = () => {
    const visibleIds = filteredStudents.map(
      (student) => student._id
    );

    const allSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) =>
        selectedStudents.includes(id)
      );

    if (allSelected) {
      setSelectedStudents((previous) =>
        previous.filter(
          (id) => !visibleIds.includes(id)
        )
      );
    } else {
      setSelectedStudents((previous) => [
        ...new Set([
          ...previous,
          ...visibleIds,
        ]),
      ]);
    }
  };

  // =====================================================
  // SEND ALERT
  // =====================================================

  const handleSendAlert = async () => {
    if (selectedStudents.length === 0) {
      alert("Please select at least one student.");
      return;
    }

    if (!subject.trim()) {
      alert("Please enter alert subject.");
      return;
    }

    if (!message.trim()) {
      alert("Please write alert message.");
      return;
    }

    try {
      setSending(true);

      const token =
        localStorage.getItem("trackwiseToken");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/alerts",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            studentIds: selectedStudents,
            type: alertType,
            subject: subject.trim(),
            message: message.trim(),
            priority,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(
          `Alert sent successfully to ${selectedStudents.length} student(s)!`
        );

        setSelectedStudents([]);
        setSubject("");
        setMessage("");
        setAlertType("Attendance Alert");
        setPriority("High");

        await fetchData();
      } else {
        alert(
          data.message || "Failed to send alert."
        );
      }
    } catch (error) {
      console.error("Send alert error:", error);

      alert(
        "Something went wrong while sending the alert."
      );
    } finally {
      setSending(false);
    }
  };

  // =====================================================
  // QUICK TEMPLATES
  // =====================================================

  const applyTemplate = (template) => {
    if (template === "Attendance Warning") {
      setAlertType("Attendance Alert");
      setSubject("Attendance Warning");
      setMessage(
        "Your attendance is below the required level. Please improve your attendance and contact your mentor if you are facing any difficulties."
      );
    }

    if (template === "Low Credit Alert") {
      setAlertType("Credit Alert");
      setSubject("Low Credit Alert");
      setMessage(
        "Your academic credits are lower than expected. Please review your academic progress and plan your remaining credits accordingly."
      );
    }

    if (template === "Assignment Reminder") {
      setAlertType("Performance Alert");
      setSubject("Assignment Reminder");
      setMessage(
        "Please make sure all pending assignments are completed and submitted before the deadline."
      );
    }

    if (template === "Meeting Reminder") {
      setAlertType("Meeting Reminder");
      setSubject("Mentor Meeting Reminder");
      setMessage(
        "This is a reminder regarding your upcoming mentor meeting. Please be available at the scheduled time."
      );
    }

    if (template === "Examination Notice") {
      setAlertType("General Notice");
      setSubject("Examination Notice");
      setMessage(
        "Please note the upcoming examination schedule and make sure you are adequately prepared."
      );
    }
  };

  // =====================================================
  // ALERT STATISTICS
  // =====================================================

  const totalAlerts = alerts.length;

  const deliveredAlerts = alerts.filter(
    (alert) => alert.status === "Delivered"
  ).length;

  const pendingAlerts = alerts.filter(
    (alert) => alert.status === "Pending"
  ).length;

  const failedAlerts = alerts.filter(
    (alert) => alert.status === "Failed"
  ).length;

  // =====================================================
  // RISK LEVEL
  // =====================================================

  const getRiskLevel = (student) => {
    if (student.riskStatus !== "At Risk") {
      return "Low";
    }

    if (
      student.cgpa < 6.5 ||
      student.attendance < 70
    ) {
      return "High";
    }

    return "Medium";
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="bulk-loading">
        Loading alerts...
      </div>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div className="bulk-page">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="mentor-sidebar">

        <div>

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
                className="mentor-menu-link mentor-active"
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

        </div>

        <button
          className="mentor-logout-btn"
          onClick={handleLogout}
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>

      </aside>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="bulk-content">

        {/* HEADER */}

        <div className="bulk-header">

          <div>
            <h1>Bulk Alerts</h1>

            <p>
              Send notifications to multiple students at once.
            </p>
          </div>

          <div className="bulk-search">

            <FaSearch />

            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

        </div>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="bulk-stats">

          <div className="bulk-card blue">

            <h4>Total Alerts Sent</h4>

            <h2>{totalAlerts}</h2>

            <p>All Time</p>

          </div>

          <div className="bulk-card orange">

            <h4>Pending Alerts</h4>

            <h2>{pendingAlerts}</h2>

            <p>Pending</p>

          </div>

          <div className="bulk-card green">

            <h4>Delivered</h4>

            <h2>{deliveredAlerts}</h2>

            <p>Successfully Delivered</p>

          </div>

          <div className="bulk-card red">

            <h4>Failed</h4>

            <h2>{failedAlerts}</h2>

            <p>Delivery Failed</p>

          </div>

        </div>

        {/* =================================================
            MAIN GRID
        ================================================= */}

        <div className="bulk-grid">

          {/* STUDENT SELECTION */}

          <div className="student-table-card">

            <div className="table-header">

              <div>

                <h2>Select Students</h2>

                <span className="selected-count">
                  {selectedStudents.length} selected
                </span>

              </div>

              <input
                type="text"
                placeholder="Search student..."
                className="table-search"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>

            <div className="bulk-table-wrapper">

              <table className="bulk-table">

                <thead>

                  <tr>

                    <th>

                      <input
                        type="checkbox"
                        checked={
                          filteredStudents.length > 0 &&
                          filteredStudents.every(
                            (student) =>
                              selectedStudents.includes(
                                student._id
                              )
                          )
                        }
                        onChange={toggleSelectAll}
                      />

                    </th>

                    <th>Student</th>

                    <th>Roll No.</th>

                    <th>Attendance</th>

                    <th>Risk Level</th>

                  </tr>

                </thead>

                <tbody>

                  {filteredStudents.length === 0 ? (

                    <tr>

                      <td
                        colSpan="5"
                        className="no-students"
                      >
                        No students found.
                      </td>

                    </tr>

                  ) : (

                    filteredStudents.map(
                      (student) => {

                        const risk =
                          getRiskLevel(student);

                        return (

                          <tr key={student._id}>

                            <td>

                              <input
                                type="checkbox"
                                checked={selectedStudents.includes(
                                  student._id
                                )}
                                onChange={() =>
                                  toggleStudent(
                                    student._id
                                  )
                                }
                              />

                            </td>

                            <td>

                              <div className="student-info">

                                <div className="student-avatar">
                                  {student.fullName
                                    ?.charAt(0)
                                    ?.toUpperCase()}
                                </div>

                                <span>
                                  {student.fullName}
                                </span>

                              </div>

                            </td>

                            <td>
                              {student.rollNumber}
                            </td>

                            <td
                              className={
                                student.attendance < 70
                                  ? "danger"
                                  : student.attendance < 75
                                  ? "warning"
                                  : "success"
                              }
                            >
                              {student.attendance}%
                            </td>

                            <td>

                              <span
                                className={`risk-badge ${risk.toLowerCase()}`}
                              >
                                {risk}
                              </span>

                            </td>

                          </tr>

                        );
                      }
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>

          {/* CREATE ALERT */}

          <div className="alert-panel">

            <h2>Create Alert</h2>

            <div className="form-group">

              <label>Alert Type</label>

              <select
                value={alertType}
                onChange={(e) =>
                  setAlertType(e.target.value)
                }
              >

                <option>
                  Attendance Alert
                </option>

                <option>
                  Credit Alert
                </option>

                <option>
                  Meeting Reminder
                </option>

                <option>
                  Performance Alert
                </option>

                <option>
                  General Notice
                </option>

              </select>

            </div>

            <div className="form-group">

              <label>Subject</label>

              <input
                type="text"
                placeholder="Enter alert subject"
                value={subject}
                onChange={(e) =>
                  setSubject(e.target.value)
                }
              />

            </div>

            <div className="form-group">

              <label>Message</label>

              <textarea
                rows="6"
                placeholder="Write your alert message..."
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value)
                }
              />

            </div>

            <div className="form-group">

              <label>Priority</label>

              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value)
                }
              >

                <option>High</option>
                <option>Medium</option>
                <option>Low</option>

              </select>

            </div>

            <div className="alert-recipient-info">

              <FaUsers />

              <span>
                {selectedStudents.length} student
                {selectedStudents.length !== 1
                  ? "s"
                  : ""}{" "}
                selected
              </span>

            </div>

            <div className="alert-buttons">

              <button
                className="send-btn"
                onClick={handleSendAlert}
                disabled={sending}
              >

                <FaPaperPlane />

                {sending
                  ? "Sending..."
                  : "Send Alert"}

              </button>

            </div>

          </div>

        </div>

        {/* =================================================
            BOTTOM SECTION
        ================================================= */}

        <div className="bulk-bottom-grid">

          {/* QUICK TEMPLATES */}

          <div className="bulk-card-box">

            <h2>
              Quick Alert Templates
            </h2>

            <button
              className="template-btn"
              onClick={() =>
                applyTemplate(
                  "Attendance Warning"
                )
              }
            >
              Attendance Warning
            </button>

            <button
              className="template-btn"
              onClick={() =>
                applyTemplate(
                  "Low Credit Alert"
                )
              }
            >
              Low Credit Alert
            </button>

            <button
              className="template-btn"
              onClick={() =>
                applyTemplate(
                  "Assignment Reminder"
                )
              }
            >
              Assignment Reminder
            </button>

            <button
              className="template-btn"
              onClick={() =>
                applyTemplate(
                  "Meeting Reminder"
                )
              }
            >
              Meeting Reminder
            </button>

            <button
              className="template-btn"
              onClick={() =>
                applyTemplate(
                  "Examination Notice"
                )
              }
            >
              Examination Notice
            </button>

          </div>

          {/* RECENT ALERTS */}

          <div className="bulk-card-box">

            <h2>
              Recent Alerts
            </h2>

            {alerts.length === 0 ? (

              <p className="no-alerts">
                No alerts sent yet.
              </p>

            ) : (

              alerts
                .slice(0, 5)
                .map((alert) => (

                  <div
                    className="recent-alert"
                    key={alert._id}
                  >

                    <h4>
                      {alert.subject}
                    </h4>

                    <span>
                      Sent to{" "}
                      {alert.recipients?.length || 0}{" "}
                      Student
                      {alert.recipients?.length !== 1
                        ? "s"
                        : ""}
                    </span>

                    <small>
                      {new Date(
                        alert.createdAt
                      ).toLocaleString("en-IN")}
                    </small>

                  </div>

                ))

            )}

          </div>

          {/* CREDIT ALERTS */}

          <div className="bulk-card-box">

            <h2>
              Credit Alerts
            </h2>

            <ul className="credit-list">

              {students
                .filter(
                  (student) =>
                    student.cgpa < 6.5
                )
                .map((student) => (

                  <li key={student._id}>

                    {student.fullName}

                    <span className="credit-badge red">
                      CGPA {student.cgpa}
                    </span>

                  </li>

                ))}

              {students.filter(
                (student) =>
                  student.cgpa < 6.5
              ).length === 0 && (

                <li className="no-alerts">
                  No critical credit alerts.
                </li>

              )}

            </ul>

          </div>

        </div>

        {/* FOOTER */}

        <div className="bulk-footer">

          © 2026 TrackWise Mentor Portal.
          All Rights Reserved.

        </div>

      </main>

    </div>
  );
}

export default BulkAlerts;