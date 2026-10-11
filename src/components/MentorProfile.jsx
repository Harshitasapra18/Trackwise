import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FaHome,
  FaUsers,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaBell,
  FaChartBar,
  FaUserCircle,
  FaSignOutAlt,
  FaEdit,
  FaEnvelope,
  FaUser,
  FaIdBadge,
} from "react-icons/fa";

import "./MentorProfile.css";

function MentorProfile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================================================
  // LOAD PROFILE DATA
  // =========================================================

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const token = localStorage.getItem("trackwiseToken");
        const storedUser = localStorage.getItem("trackwiseUser");

        // -----------------------------------------------------
        // CHECK LOGIN
        // -----------------------------------------------------

        if (!token || !storedUser) {
          navigate("/login", { replace: true });
          return;
        }

        // -----------------------------------------------------
        // GET LOGGED-IN USER
        // -----------------------------------------------------

        const parsedUser = JSON.parse(storedUser);

        // Only mentor can access this page
        if (parsedUser.role !== "mentor") {
          navigate("/mentee-dashboard", { replace: true });
          return;
        }

        // -----------------------------------------------------
        // SET USER
        // -----------------------------------------------------

        setUser(parsedUser);

        // -----------------------------------------------------
        // GET STUDENTS
        // -----------------------------------------------------

        const studentsResponse = await fetch(
          "http://localhost:5000/api/students",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const studentsData = await studentsResponse.json();

        if (studentsResponse.ok) {
          setStudents(studentsData.students || []);
        } else {
          console.error(
            "Failed to fetch students:",
            studentsData.message
          );
        }

        // -----------------------------------------------------
        // GET MEETINGS
        // -----------------------------------------------------

        const meetingsResponse = await fetch(
          "http://localhost:5000/api/meetings",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const meetingsData = await meetingsResponse.json();

        if (meetingsResponse.ok) {
          setMeetings(meetingsData.meetings || []);
        } else {
          console.error(
            "Failed to fetch meetings:",
            meetingsData.message
          );
        }
      } catch (error) {
        console.error("Profile fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [navigate]);

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem("trackwiseToken");
    localStorage.removeItem("trackwiseUser");

    navigate("/login", { replace: true });
  };

  // =========================================================
  // EDIT PROFILE
  // =========================================================

  const handleEditProfile = () => {
    alert(
      "Profile editing will be available once the profile update API is added."
    );
  };

  // =========================================================
  // CALCULATIONS
  // =========================================================

  const totalMentees = students.length;

  const atRiskStudents = students.filter(
    (student) => student.riskStatus === "At Risk"
  ).length;

  const totalMeetings = meetings.length;

  const safeStudents = students.filter(
    (student) => student.riskStatus !== "At Risk"
  ).length;

  const followUpRate =
    totalMentees > 0
      ? Math.round((safeStudents / totalMentees) * 100)
      : 0;

  // =========================================================
  // GET INITIALS
  // =========================================================

  const getInitials = (name) => {
    if (!name) {
      return "M";
    }

    const words = name.trim().split(/\s+/);

    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    return (
      words[0].charAt(0) +
      words[words.length - 1].charAt(0)
    ).toUpperCase();
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="mentor-profile-loading">
        <div className="profile-loading-box">
          Loading profile...
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="mentor-profile-page">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="mentor-sidebar">

        <div>

          {/* LOGO */}

          <div className="mentor-logo">
            <h2>TrackWise</h2>
          </div>

          {/* MENU */}

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
                className="mentor-menu-link mentor-active"
              >
                <FaUserCircle />
                <span>Profile</span>
              </Link>
            </li>

          </ul>
        </div>

        {/* LOGOUT */}

        <button
          type="button"
          className="mentor-logout-btn"
          onClick={handleLogout}
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>

      </aside>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="profile-content">

        {/* HEADER */}

        <div className="profile-header">

          <div>
            <h1>Mentor Profile</h1>

            <p>
              Manage your professional information and
              account details.
            </p>
          </div>

          <button
            type="button"
            className="edit-profile-btn"
            onClick={handleEditProfile}
          >
            <FaEdit />
            Edit Profile
          </button>

        </div>

        {/* =====================================================
            MAIN PROFILE CARD
        ===================================================== */}

        <section className="profile-card-main">

          <div className="mentor-avatar">
            {getInitials(user?.fullName)}
          </div>

          <div className="profile-name">

            <h2>
              {user?.fullName || "Mentor"}
            </h2>

            <p>
              Academic Mentor
            </p>

            <span>
              <b>●</b> Active Mentor
            </span>

          </div>

          <div className="profile-id">

            <small>Username</small>

            <b>
              @{user?.username || "mentor"}
            </b>

          </div>

        </section>

        {/* =====================================================
            INFORMATION + MENTORSHIP OVERVIEW
        ===================================================== */}

        <section className="profile-grid">

          {/* PERSONAL INFORMATION */}

          <div className="profile-box">

            <h2>Personal Information</h2>

            <div className="info-item">

              <FaEnvelope />

              <div>
                <small>Email</small>

                <b>
                  {user?.email || "Not available"}
                </b>
              </div>

            </div>

            <div className="info-item">

              <FaUser />

              <div>
                <small>Username</small>

                <b>
                  {user?.username || "Not available"}
                </b>
              </div>

            </div>

            <div className="info-item">

              <FaIdBadge />

              <div>
                <small>Role</small>

                <b>
                  {user?.role
                    ? user.role.charAt(0).toUpperCase() +
                      user.role.slice(1)
                    : "Mentor"}
                </b>
              </div>

            </div>

          </div>

          {/* MENTORSHIP OVERVIEW */}

          <div className="profile-box">

            <h2>Mentorship Overview</h2>

            <div className="profile-metrics">

              <div>
                <b>{totalMentees}</b>
                <span>Total Mentees</span>
              </div>

              <div>
                <b>{atRiskStudents}</b>
                <span>At Risk</span>
              </div>

              <div>
                <b>{totalMeetings}</b>
                <span>Meetings</span>
              </div>

              <div>
                <b>{followUpRate}%</b>
                <span>Follow-up Rate</span>
              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            RESPONSIBILITIES
        ===================================================== */}

        <section className="profile-box responsibilities">

          <h2>Mentor Responsibilities</h2>

          <ul>

            <li>
              Monitor academic performance, attendance and
              credits.
            </li>

            <li>
              Schedule regular mentoring meetings with
              assigned students.
            </li>

            <li>
              Identify at-risk students and initiate timely
              interventions.
            </li>

            <li>
              Send academic alerts and maintain mentor notes.
            </li>

          </ul>

        </section>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div className="profile-footer">
          © 2026 TrackWise Mentor Portal. All Rights Reserved.
        </div>

      </main>

    </div>
  );
}

export default MentorProfile;