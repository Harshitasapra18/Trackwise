import { Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";

import {
  FaHome,
  FaUsers,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaBell,
  FaChartBar,
  FaUserCircle,
  FaSignOutAlt,
  FaDownload,
  FaFilePdf,
  FaFileExcel,
} from "react-icons/fa";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import "./Reports.css";

function Reports() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // FETCH STUDENTS
  // =====================================================

  const fetchStudents = useCallback(async () => {
    try {
      const token = localStorage.getItem("trackwiseToken");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/students",
        {
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
      console.error("Fetch students error:", error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStudents();
  }, [fetchStudents]);

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("trackwiseToken");
    localStorage.removeItem("trackwiseUser");

    navigate("/login");
  };

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
  // STATISTICS
  // =====================================================

  const totalStudents = students.length;

  const averageCGPA =
    totalStudents > 0
      ? (
          students.reduce(
            (sum, student) =>
              sum + Number(student.cgpa || 0),
            0
          ) / totalStudents
        ).toFixed(2)
      : "0.00";

  const averageAttendance =
    totalStudents > 0
      ? Math.round(
          students.reduce(
            (sum, student) =>
              sum + Number(student.attendance || 0),
            0
          ) / totalStudents
        )
      : 0;

  const atRiskStudents = students.filter(
    (student) => student.riskStatus === "At Risk"
  );

  const highRiskStudents = students.filter(
    (student) => getRiskLevel(student) === "High"
  );

  const mediumRiskStudents = students.filter(
    (student) => getRiskLevel(student) === "Medium"
  );

  const lowRiskStudents = students.filter(
    (student) => getRiskLevel(student) === "Low"
  );

  // =====================================================
  // RISK CHART DATA
  // =====================================================

  const riskData = [
    {
      name: "Low",
      value: lowRiskStudents.length,
    },
    {
      name: "Medium",
      value: mediumRiskStudents.length,
    },
    {
      name: "High",
      value: highRiskStudents.length,
    },
  ];

  // =====================================================
  // CGPA / ATTENDANCE DATA
  // =====================================================
  // Since Student model currently stores current CGPA
  // and attendance only, the charts use current student
  // data instead of inventing semester history.

  const cgpaData = students.map((student, index) => ({
    semester: `Student ${index + 1}`,
    cgpa: Number(student.cgpa || 0),
  }));

  const attendanceData = students.map(
    (student, index) => ({
      name: `Student ${index + 1}`,
      attendance: Number(
        student.attendance || 0
      ),
    })
  );

  // =====================================================
  // TOP PERFORMERS
  // =====================================================

  const topPerformers = [...students]
    .sort(
      (a, b) =>
        Number(b.cgpa || 0) -
        Number(a.cgpa || 0)
    )
    .slice(0, 5);

  // =====================================================
  // STUDENTS NEEDING ATTENTION
  // =====================================================

  const attentionStudents = [...students]
    .sort((a, b) => {
      const riskOrder = {
        High: 3,
        Medium: 2,
        Low: 1,
      };

      return (
        riskOrder[getRiskLevel(b)] -
          riskOrder[getRiskLevel(a)] ||
        Number(a.cgpa || 0) -
          Number(b.cgpa || 0)
      );
    })
    .slice(0, 10);

  // =====================================================
  // EXPORT CSV
  // =====================================================

  const exportCSV = () => {
    if (students.length === 0) {
      alert("No student data available.");
      return;
    }

    const headers = [
      "Student",
      "Roll Number",
      "Department",
      "Semester",
      "CGPA",
      "Attendance",
      "Risk Status",
    ];

    const rows = students.map((student) => [
      student.fullName,
      student.rollNumber,
      student.department,
      student.semester,
      student.cgpa,
      student.attendance,
      getRiskLevel(student),
    ]);

    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => `"${value ?? ""}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      "TrackWise_Report.csv";

    link.click();

    URL.revokeObjectURL(url);
  };

  // =====================================================
  // DOWNLOAD REPORT
  // =====================================================

  const handleDownload = () => {
    exportCSV();
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="reports-loading">
        Loading reports...
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="reports-page">

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
                className="mentor-menu-link"
              >
                <FaBell />
                <span>Bulk Alerts</span>
              </Link>
            </li>

            <li>
              <Link
                to="/reports"
                className="mentor-menu-link mentor-active"
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

      <main className="reports-content">

        {/* HEADER */}

        <header className="reports-header">

          <div>

            <h1>Reports Dashboard</h1>

            <p>
              Track academic performance and mentor insights.
            </p>

          </div>

          <div className="report-actions">

            <button
              onClick={exportCSV}
            >
              <FaFilePdf />
              Export PDF
            </button>

            <button
              onClick={exportCSV}
            >
              <FaFileExcel />
              Export Excel
            </button>

            <button
              onClick={handleDownload}
            >
              <FaDownload />
              Download
            </button>

          </div>

        </header>

        {/* =================================================
            REPORT STATS
        ================================================= */}

        <section className="report-stats">

          <div>
            <span>Total Students</span>

            <strong>
              {totalStudents}
            </strong>

            <small>
              Across your mentees
            </small>
          </div>

          <div>
            <span>Average CGPA</span>

            <strong>
              {averageCGPA}
            </strong>

            <small>
              Current average
            </small>
          </div>

          <div>
            <span>Average Attendance</span>

            <strong>
              {averageAttendance}%
            </strong>

            <small>
              Current average
            </small>
          </div>

          <div>
            <span>At Risk Students</span>

            <strong>
              {atRiskStudents.length}
            </strong>

            <small>
              {highRiskStudents.length} high risk
            </small>
          </div>

        </section>

        {/* =================================================
            REPORT GRID
        ================================================= */}

        <section className="report-grid">

          {/* CGPA */}

          <div className="report-panel wide">

            <div className="panel-title">

              <div>

                <h2>CGPA Overview</h2>

                <p>
                  Current CGPA of your students
                </p>

              </div>

            </div>

            <div className="chart">

              {students.length === 0 ? (

                <p className="no-report-data">
                  No student data available.
                </p>

              ) : (

                <ResponsiveContainer
                  width="100%"
                  height={280}
                >

                  <LineChart
                    data={cgpaData}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="semester"
                    />

                    <YAxis
                      domain={[0, 10]}
                    />

                    <Tooltip />

                    <Line
                      type="monotone"
                      dataKey="cgpa"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />

                  </LineChart>

                </ResponsiveContainer>

              )}

            </div>

          </div>

          {/* RISK DISTRIBUTION */}

          <div className="report-panel">

            <div className="panel-title">

              <div>

                <h2>Risk Distribution</h2>

                <p>
                  Current student risk levels
                </p>

              </div>

            </div>

            <div className="chart">

              {students.length === 0 ? (

                <p className="no-report-data">
                  No student data available.
                </p>

              ) : (

                <ResponsiveContainer
                  width="100%"
                  height={280}
                >

                  <PieChart>

                    <Pie
                      data={riskData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="48%"
                      outerRadius={88}
                      label
                    >

                      {riskData.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                          />
                        )
                      )}

                    </Pie>

                    <Tooltip />

                    <Legend />

                  </PieChart>

                </ResponsiveContainer>

              )}

            </div>

          </div>

          {/* ATTENDANCE */}

          <div className="report-panel wide">

            <div className="panel-title">

              <div>

                <h2>Attendance Overview</h2>

                <p>
                  Current attendance percentage
                </p>

              </div>

            </div>

            <div className="chart">

              {students.length === 0 ? (

                <p className="no-report-data">
                  No student data available.
                </p>

              ) : (

                <ResponsiveContainer
                  width="100%"
                  height={280}
                >

                  <BarChart
                    data={attendanceData}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="name"
                    />

                    <YAxis
                      domain={[0, 100]}
                    />

                    <Tooltip />

                    <Bar
                      dataKey="attendance"
                      radius={[
                        6,
                        6,
                        0,
                        0,
                      ]}
                    />

                  </BarChart>

                </ResponsiveContainer>

              )}

            </div>

          </div>

          {/* TOP PERFORMERS */}

          <div className="report-panel">

            <div className="panel-title">

              <div>

                <h2>Top Performers</h2>

                <p>
                  Highest current CGPA
                </p>

              </div>

            </div>

            {topPerformers.length === 0 ? (

              <p className="no-report-data">
                No student data available.
              </p>

            ) : (

              topPerformers.map(
                (student) => (

                  <div
                    className="performer"
                    key={student._id}
                  >

                    <b>
                      {student.fullName}
                    </b>

                    <span>
                      {Number(
                        student.cgpa
                      ).toFixed(2)}
                    </span>

                  </div>

                )
              )

            )}

          </div>

        </section>

        {/* =================================================
            ACADEMIC SUMMARY
        ================================================= */}

        <section className="report-panel full">

          <div className="panel-title">

            <div>

              <h2>
                Academic Summary
              </h2>

              <p>
                Students needing attention based on current indicators
              </p>

            </div>

          </div>

          <div className="summary-table">

            <div className="summary-row head">

              <span>Student</span>

              <span>CGPA</span>

              <span>Attendance</span>

              <span>Semester</span>

              <span>Status</span>

            </div>

            {attentionStudents.length === 0 ? (

              <div className="summary-row">

                <span>
                  No student data available.
                </span>

              </div>

            ) : (

              attentionStudents.map(
                (student) => {

                  const risk =
                    getRiskLevel(student);

                  const status =
                    risk === "Low"
                      ? "Good"
                      : risk;

                  return (

                    <div
                      className="summary-row"
                      key={student._id}
                    >

                      <span>
                        {student.fullName}
                      </span>

                      <span>
                        {Number(
                          student.cgpa
                        ).toFixed(2)}
                      </span>

                      <span>
                        {student.attendance}%
                      </span>

                      <span>
                        {student.semester}
                      </span>

                      <span
                        className={`report-badge ${
                          status.toLowerCase()
                        }`}
                      >
                        {status}
                      </span>

                    </div>

                  );
                }
              )

            )}

          </div>

        </section>

        {/* FOOTER */}

        <div className="reports-footer">

          © 2026 TrackWise Mentor Portal.
          All Rights Reserved.

        </div>

      </main>

    </div>
  );
}

export default Reports;