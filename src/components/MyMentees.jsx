import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./MyMentees.css";

import {
  FaHome,
  FaUsers,
  FaUserCircle,
  FaCalendarAlt,
  FaBell,
  FaExclamationTriangle,
  FaChartBar,
  FaSignOutAlt,
  FaSearch,
  FaFileExport,
  FaLink,
  FaTimes,
} from "react-icons/fa";

function MyMentees() {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [branchFilter, setBranchFilter] = useState("All Branches");
  const [semesterFilter, setSemesterFilter] =
    useState("All Semesters");

  // Link mentee state
  const [linkStudent, setLinkStudent] = useState(null);
  const [menteeEmail, setMenteeEmail] = useState("");
  const [linking, setLinking] = useState(false);

  // =========================================================
  // LOGGED-IN MENTOR
  // =========================================================

  const storedUser = localStorage.getItem("trackwiseUser");

  let mentor = null;

  try {
    mentor = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Error reading mentor data:", error);
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem("trackwiseToken");
    localStorage.removeItem("trackwiseUser");

    navigate("/login", { replace: true });
  };

  // =========================================================
  // FETCH STUDENTS
  // =========================================================

  const fetchStudents = async () => {
    try {
      const token =
        localStorage.getItem("trackwiseToken");

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
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setStudents(data.students || []);
      } else {
        console.error(data.message);

        if (response.status === 401) {
          localStorage.removeItem("trackwiseToken");
          localStorage.removeItem("trackwiseUser");

          navigate("/login", { replace: true });
        }
      }
    } catch (error) {
      console.error(
        "Error fetching students:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL FETCH
  // =========================================================

  useEffect(() => {
    fetchStudents();
  }, [navigate]);

  // =========================================================
  // STUDENT STATUS
  // =========================================================

  const getStudentStatus = (student) => {
    if (student.riskStatus === "At Risk") {
      return {
        text: "At Risk",
        className: "risk",
      };
    }

    if (
      student.attendance < 75 ||
      student.cgpa < 7
    ) {
      return {
        text: "Warning",
        className: "warning",
      };
    }

    return {
      text: "Normal",
      className: "normal",
    };
  };

  // =========================================================
  // FILTER STUDENTS
  // =========================================================

  const filteredStudents = students.filter(
    (student) => {
      const status = getStudentStatus(student);

      const search =
        searchTerm.toLowerCase();

      const matchesSearch =
        student.fullName
          ?.toLowerCase()
          .includes(search) ||
        student.rollNumber
          ?.toLowerCase()
          .includes(search);

      const matchesStatus =
        statusFilter === "All Status" ||
        status.text === statusFilter;

      const matchesBranch =
        branchFilter === "All Branches" ||
        student.department === branchFilter;

      const matchesSemester =
        semesterFilter === "All Semesters" ||
        student.semester ===
          Number(
            semesterFilter.replace(
              "Semester ",
              ""
            )
          );

      return (
        matchesSearch &&
        matchesStatus &&
        matchesBranch &&
        matchesSemester
      );
    }
  );

  // =========================================================
  // SUMMARY
  // =========================================================

  const totalMentees =
    students.length;

  const normalStudents =
    students.filter(
      (student) =>
        getStudentStatus(student).text ===
        "Normal"
    ).length;

  const warningStudents =
    students.filter(
      (student) =>
        getStudentStatus(student).text ===
        "Warning"
    ).length;

  const atRiskStudents =
    students.filter(
      (student) =>
        getStudentStatus(student).text ===
        "At Risk"
    ).length;

  // =========================================================
  // OPEN LINK MODAL
  // =========================================================


  // =========================================================
  // CLOSE LINK MODAL
  // =========================================================

  const closeLinkModal = () => {
    if (linking) return;

    setLinkStudent(null);
    setMenteeEmail("");
  };

  // =========================================================
  // LINK MENTEE ACCOUNT
  // =========================================================

  const handleLinkMentee = async (e) => {
    e.preventDefault();

    if (!linkStudent) {
      return;
    }

    if (!menteeEmail.trim()) {
      alert("Please enter the mentee account email.");
      return;
    }

    try {
      setLinking(true);

      const token =
        localStorage.getItem("trackwiseToken");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/students/link-mentee",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentId: linkStudent._id,
            menteeEmail:
              menteeEmail.trim().toLowerCase(),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(
          "Mentee account linked successfully!"
        );

        // Update student in current list
        setStudents((previousStudents) =>
          previousStudents.map((student) =>
            student._id ===
            linkStudent._id
              ? data.student
              : student
          )
        );

        closeLinkModal();
      } else {
        alert(
          data.message ||
            "Unable to link mentee account."
        );
      }
    } catch (error) {
      console.error(
        "Error linking mentee:",
        error
      );

      alert(
        "Unable to connect to the server."
      );
    } finally {
      setLinking(false);
    }
  };

  // =========================================================
  // EXPORT
  // =========================================================

  const handleExport = () => {
    if (students.length === 0) {
      alert(
        "No students available to export."
      );
      return;
    }

    const headers = [
      "Name",
      "Roll Number",
      "Email",
      "Department",
      "Semester",
      "CGPA",
      "Attendance",
      "Status",
      "Mentee Account",
    ];

    const rows = students.map(
      (student) => {
        const status =
          getStudentStatus(student);

        return [
          student.fullName,
          student.rollNumber,
          student.email,
          student.department,
          student.semester,
          student.cgpa,
          `${student.attendance}%`,
          status.text,
          student.user?.email ||
            "Not Linked",
        ];
      }
    );

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map(
            (value) =>
              `"${String(value).replace(
                /"/g,
                '""'
              )}"`
          )
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob(
      [csvContent],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      "TrackWise_Mentees.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="mentees-page">

      {/* ===================================================
          SIDEBAR
      =================================================== */}

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
                className="mentor-menu-link mentor-active"
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

        </div>

        <button
          className="mentor-logout-btn"
          onClick={handleLogout}
        >
          <FaSignOutAlt />

          <span
            style={{
              marginLeft: "8px",
            }}
          >
            Logout
          </span>
        </button>

      </aside>


      {/* ===================================================
          MAIN CONTENT
      =================================================== */}

      <main className="content">

        {/* HEADER */}

        <div className="top-header">

          <div>

            <h1>My Mentees</h1>

            <p>
              View all students assigned to you.
            </p>

          </div>

          <div className="mentor-profile">

            <FaBell className="bell" />

            <img
              src="https://i.pravatar.cc/60?img=12"
              alt="mentor"
            />

            <div>

              <h4>
                {mentor?.fullName ||
                  "Mentor"}
              </h4>

              <span>Mentor</span>

            </div>

          </div>

        </div>


        {/* ===================================================
            SEARCH & FILTERS
        =================================================== */}

        <div className="filter-bar">

          <div className="search-box">

            <FaSearch />

            <input
              type="text"
              placeholder="Search by name or roll number..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
            />

          </div>


          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
          >
            <option>
              All Status
            </option>

            <option>
              Normal
            </option>

            <option>
              Warning
            </option>

            <option>
              At Risk
            </option>

          </select>


          <select
            value={branchFilter}
            onChange={(e) =>
              setBranchFilter(
                e.target.value
              )
            }
          >

            <option>
              All Branches
            </option>

            {[
              ...new Set(
                students
                  .map(
                    (student) =>
                      student.department
                  )
                  .filter(Boolean)
              ),
            ].map(
              (department) => (
                <option
                  key={department}
                  value={department}
                >
                  {department}
                </option>
              )
            )}

          </select>


          <select
            value={semesterFilter}
            onChange={(e) =>
              setSemesterFilter(
                e.target.value
              )
            }
          >

            <option>
              All Semesters
            </option>

            {[
              ...new Set(
                students
                  .map(
                    (student) =>
                      student.semester
                  )
                  .filter(Boolean)
              ),
            ]
              .sort(
                (a, b) => a - b
              )
              .map(
                (semester) => (
                  <option
                    key={semester}
                    value={`Semester ${semester}`}
                  >
                    Semester{" "}
                    {semester}
                  </option>
                )
              )}

          </select>


          <button
            className="export-btn"
            onClick={handleExport}
          >
            <FaFileExport />

            Export Mentees List
          </button>

        </div>


        {/* ===================================================
            SUMMARY CARDS
        =================================================== */}

        <div className="summary-cards">

          <div className="summary-card blue">

            <h2>
              {loading
                ? "..."
                : totalMentees}
            </h2>

            <p>
              Total Mentees
            </p>

          </div>


          <div className="summary-card green">

            <h2>
              {loading
                ? "..."
                : normalStudents}
            </h2>

            <p>
              Normal
            </p>

          </div>


          <div className="summary-card orange">

            <h2>
              {loading
                ? "..."
                : warningStudents}
            </h2>

            <p>
              Warning
            </p>

          </div>


          <div className="summary-card red">

            <h2>
              {loading
                ? "..."
                : atRiskStudents}
            </h2>

            <p>
              At Risk
            </p>

          </div>

        </div>


        {/* ===================================================
            STUDENT CARDS
        =================================================== */}

        <div className="students-grid">

          {loading ? (

            <p>
              Loading students...
            </p>

          ) : filteredStudents.length === 0 ? (

            <p>
              No students found.
            </p>

          ) : (

            filteredStudents.map(
              (student, index) => {

                const status =
                  getStudentStatus(
                    student
                  );

                const isLinked =
                  Boolean(
                    student.user
                  );

                return (

                  <div
                    className="student-card"
                    key={student._id}
                  >

                    {/* STUDENT HEADER */}

                    <div className="student-header">

                      <img
                        src={`https://i.pravatar.cc/100?img=${
                          index + 10
                        }`}
                        alt={
                          student.fullName
                        }
                      />

                      <div>

                        <h3>
                          {student.fullName}
                        </h3>

                        <p>
                          {student.rollNumber}
                        </p>

                        <small>
                          {
                            student.department
                          }{" "}
                          • Sem{" "}
                          {
                            student.semester
                          }
                        </small>

                      </div>

                    </div>


                    {/* STUDENT INFO */}

                    <div className="student-info">

                      <div>

                        <span>
                          CGPA
                        </span>

                        <h3>
                          {
                            student.cgpa
                          }
                        </h3>

                      </div>


                      <div>

                        <span>
                          Attendance
                        </span>

                        <h3>
                          {
                            student.attendance
                          }%
                        </h3>

                      </div>

                    </div>


                    {/* STATUS */}

                    <div
                      className={`status ${status.className}`}
                    >
                      {
                        status.text
                      }
                    </div>


                    {/* LINK STATUS */}

                    <div
                      style={{
                        marginTop:
                          "10px",
                        fontSize:
                          "12px",
                        color:
                          isLinked
                            ? "#16a34a"
                            : "#777",
                        fontWeight:
                          "600",
                      }}
                    >
                      {isLinked
                        ? `✓ Linked: ${student.user.email}`
                        : "○ Mentee account not linked"}
                    </div>


                    {/* ACTIONS */}

                    <div className="student-actions">

                      <Link
                        to={`/student-profile/${student._id}`}
                      >
                        <button className="view-btn">
                          View Profile
                        </button>
                      </Link>


                      {!isLinked ? (

                        <button
                          onClick={() =>
                            alert("Mentee accounts are linked by the admin.")
                          }
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap:
                              "5px",
                          }}
                        >
                          <FaLink />
                          Not Linked
                        </button>

                      ) : (

                        <button
                          disabled
                          style={{
                            opacity: 0.6,
                            cursor:
                              "not-allowed",
                          }}
                        >
                          Linked
                        </button>

                      )}


                      <button onClick={() => navigate(`/student-profile/${student._id}`)}>
                        Add Note
                      </button>

                      <button onClick={() => navigate("/meetings")}>
                        Schedule
                      </button>

                    </div>

                  </div>

                );
              }
            )

          )}

        </div>

      </main>


      {/* =====================================================
          LINK MENTEE MODAL
      ===================================================== */}

      {linkStudent && (

        <div
          style={{
            position:
              "fixed",
            inset: 0,
            background:
              "rgba(0, 0, 0, 0.45)",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            zIndex: 9999,
          }}
        >

          <div
            style={{
              width:
                "420px",
              maxWidth:
                "90%",
              background:
                "#ffffff",
              borderRadius:
                "14px",
              padding:
                "28px",
              boxShadow:
                "0 15px 50px rgba(0,0,0,0.2)",
            }}
          >

            {/* MODAL HEADER */}

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom:
                  "20px",
              }}
            >

              <h2
                style={{
                  margin: 0,
                }}
              >
                Link Mentee Account
              </h2>

              <button
                onClick={
                  closeLinkModal
                }
                disabled={linking}
                style={{
                  border:
                    "none",
                  background:
                    "transparent",
                  fontSize:
                    "20px",
                  cursor:
                    "pointer",
                }}
              >
                <FaTimes />
              </button>

            </div>


            {/* STUDENT INFO */}

            <div
              style={{
                background:
                  "#f3f6fb",
                padding:
                  "14px",
                borderRadius:
                  "10px",
                marginBottom:
                  "20px",
              }}
            >

              <strong>
                {linkStudent.fullName}
              </strong>

              <div
                style={{
                  marginTop:
                    "5px",
                  fontSize:
                    "13px",
                  color:
                    "#666",
                }}
              >
                {
                  linkStudent.rollNumber
                }{" "}
                •{" "}
                {
                  linkStudent.department
                }{" "}
                • Semester{" "}
                {
                  linkStudent.semester
                }
              </div>

            </div>


            {/* FORM */}

            <form
              onSubmit={
                handleLinkMentee
              }
            >

              <label
                style={{
                  display:
                    "block",
                  marginBottom:
                    "8px",
                  fontWeight:
                    "600",
                }}
              >
                Mentee Account Email
              </label>

              <input
                type="email"
                placeholder="Enter mentee login email"
                value={
                  menteeEmail
                }
                onChange={(e) =>
                  setMenteeEmail(
                    e.target.value
                  )
                }
                disabled={
                  linking
                }
                style={{
                  width:
                    "100%",
                  boxSizing:
                    "border-box",
                  padding:
                    "12px",
                  border:
                    "1px solid #d1d5db",
                  borderRadius:
                    "8px",
                  fontSize:
                    "14px",
                  marginBottom:
                    "18px",
                }}
              />


              <p
                style={{
                  fontSize:
                    "12px",
                  color:
                    "#777",
                  marginTop:
                    "-8px",
                  marginBottom:
                    "20px",
                }}
              >
                Enter the email used by the
                mentee to log in to TrackWise.
              </p>


              {/* BUTTONS */}

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "flex-end",
                  gap:
                    "10px",
                }}
              >

                <button
                  type="button"
                  onClick={
                    closeLinkModal
                  }
                  disabled={
                    linking
                  }
                  style={{
                    padding:
                      "10px 18px",
                    border:
                      "1px solid #ddd",
                    borderRadius:
                      "8px",
                    background:
                      "#fff",
                    cursor:
                      "pointer",
                  }}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={
                    linking
                  }
                  style={{
                    padding:
                      "10px 18px",
                    border:
                      "none",
                    borderRadius:
                      "8px",
                    background:
                      "#2864e8",
                    color:
                      "#fff",
                    cursor:
                      "pointer",
                    fontWeight:
                      "600",
                  }}
                >
                  {linking
                    ? "Linking..."
                    : "Link Account"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default MyMentees;