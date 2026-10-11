import "./AtRiskStudents.css";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  FaHome,
  FaUsers,
  FaCalendarAlt,
  FaBell,
  FaChartBar,
  FaSignOutAlt,
  FaExclamationTriangle,
  FaSearch,
  FaEye,
  FaEnvelope,
  FaUserCircle,
} from "react-icons/fa";

function AtRiskStudents() {
  const navigate = useNavigate();

  // ================= State =================

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

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

    fetchStudents();
  }, [navigate]);

  // ================= Risk Level =================

  const getRiskLevel = (student) => {
    if (
      student.cgpa < 6.5 ||
      student.attendance < 70
    ) {
      return {
        text: "High",
        className: "high",
      };
    }

    if (
      student.cgpa < 7 ||
      student.attendance < 75
    ) {
      return {
        text: "Medium",
        className: "medium",
      };
    }

    return {
      text: "Low",
      className: "low",
    };
  };

  // ================= Filter At Risk =================

  const atRiskStudents = students.filter(
    (student) =>
      student.riskStatus === "At Risk"
  );

  const filteredStudents = atRiskStudents.filter(
    (student) => {
      const search = searchTerm.toLowerCase();

      return (
        student.fullName
          .toLowerCase()
          .includes(search) ||
        student.rollNumber
          .toLowerCase()
          .includes(search)
      );
    }
  );

  // ================= Statistics =================

  const totalAtRisk = atRiskStudents.length;

  const highRisk = atRiskStudents.filter(
    (student) =>
      getRiskLevel(student).text === "High"
  ).length;

  const mediumRisk = atRiskStudents.filter(
    (student) =>
      getRiskLevel(student).text === "Medium"
  ).length;

  const lowRisk = atRiskStudents.filter(
    (student) =>
      getRiskLevel(student).text === "Low"
  ).length;

  // ================= Main UI =================

  return (
    <div className="risk-page">

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
                className="mentor-menu-link"
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

            {/* At Risk */}

            <li>
              <Link
                to="/at-risk"
                className="mentor-menu-link mentor-active"
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

        {/* Logout */}

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

      <main className="risk-content">

        {/* ================= Header ================= */}

        <div className="risk-header">

          <div>
            <h1>At Risk Students</h1>

            <p>
              Monitor students requiring immediate
              mentor attention.
            </p>
          </div>

          <div className="risk-search">

            <FaSearch />

            <input
              type="text"
              placeholder="Search student..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
            />

          </div>

        </div>

        {/* ================= Statistics ================= */}

        <div className="risk-stats">

          <div className="risk-card red">

            <h4>Total At Risk</h4>

            <h2>
              {loading ? "..." : totalAtRisk}
            </h2>

            <p>
              Need mentor review
            </p>

          </div>

          <div className="risk-card orange">

            <h4>High Risk</h4>

            <h2>
              {loading ? "..." : highRisk}
            </h2>

            <p>
              Immediate action
            </p>

          </div>

          <div className="risk-card blue">

            <h4>Medium Risk</h4>

            <h2>
              {loading ? "..." : mediumRisk}
            </h2>

            <p>
              Schedule meeting
            </p>

          </div>

          <div className="risk-card green">

            <h4>Low Risk</h4>

            <h2>
              {loading ? "..." : lowRisk}
            </h2>

            <p>
              Monitor regularly
            </p>

          </div>

        </div>

        {/* ================= Students Table ================= */}

        <div className="risk-table-card">

          <h2>
            Students Requiring Attention
          </h2>

          {loading ? (

            <p style={{ padding: "20px" }}>
              Loading at-risk students...
            </p>

          ) : filteredStudents.length === 0 ? (

            <p style={{ padding: "20px" }}>
              No at-risk students found.
            </p>

          ) : (

            <table className="risk-table">

              <thead>

                <tr>
                  <th>Student</th>
                  <th>Attendance</th>
                  <th>CGPA</th>
                  <th>Risk</th>
                  <th>Actions</th>
                </tr>

              </thead>

              <tbody>

                {filteredStudents.map(
                  (student, index) => {

                    const risk =
                      getRiskLevel(student);

                    return (

                      <tr key={student._id}>

                        {/* Student */}

                        <td>

                          <div className="risk-student">

                            <img
                              src={`https://i.pravatar.cc/50?img=${index + 5}`}
                              alt={student.fullName}
                            />

                            <div>

                              <h4>
                                {student.fullName}
                              </h4>

                              <span>
                                {student.rollNumber}
                              </span>

                            </div>

                          </div>

                        </td>

                        {/* Attendance */}

                        <td>
                          {student.attendance}%
                        </td>

                        {/* CGPA */}

                        <td>
                          {student.cgpa}
                        </td>

                        {/* Risk */}

                        <td>

                          <span
                            className={`badge ${risk.className}`}
                          >
                            {risk.text}
                          </span>

                        </td>

                        {/* Actions */}

                        <td>

                          {/* View Profile */}

                          <Link
                            to={`/student-profile/${student._id}`}
                          >
                            <button
                              className="action-btn"
                              title="View Profile"
                            >
                              <FaEye />
                            </button>
                          </Link>

                          {/* Schedule */}

                          <Link to="/meetings">
                            <button
                              className="action-btn meeting"
                              title="Schedule Meeting"
                            >
                              <FaCalendarAlt />
                            </button>
                          </Link>

                          {/* Alert */}

                          <Link to="/bulk-alerts">
                            <button
                              className="action-btn alert"
                              title="Send Alert"
                            >
                              <FaEnvelope />
                            </button>
                          </Link>

                        </td>

                      </tr>

                    );
                  }
                )}

              </tbody>

            </table>

          )}

        </div>

      </main>

    </div>
  );
}

export default AtRiskStudents;