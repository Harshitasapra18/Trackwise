import "./MeetingDashboard.css";
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
  FaClock,
  FaVideo,
  FaPlus,
  FaSearch,
  FaEye,
  FaEdit,
  FaTrash,
  FaTimes,
  FaStickyNote,
  FaDownload,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

function MeetingDashboard() {
  const navigate = useNavigate();

  // =========================================================
  // STATES
  // =========================================================

  const [meetings, setMeetings] = useState([]);
  const [students, setStudents] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showScheduleForm, setShowScheduleForm] =
    useState(false);

  const [editingMeeting, setEditingMeeting] =
    useState(null);

  const [submitting, setSubmitting] =
    useState(false);

  const [meetingForm, setMeetingForm] = useState({
    studentId: "",
    title: "",
    date: "",
    time: "",
    mode: "Online",
    notes: "",
  });

  const [currentMonth, setCurrentMonth] =
    useState(new Date());

  // =========================================================
  // FETCH MEETINGS AND STUDENTS
  // =========================================================

  const fetchData = useCallback(async () => {
    try {
      const token =
        localStorage.getItem("trackwiseToken");

      if (!token) {
        navigate("/login");
        return;
      }

      // ---------------- MEETINGS ----------------

      const meetingsResponse = await fetch(
        "http://localhost:5000/api/meetings",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const meetingsData =
        await meetingsResponse.json();

      if (meetingsResponse.ok) {
        setMeetings(
          meetingsData.meetings || []
        );
      } else {
        console.error(
          "Failed to fetch meetings:",
          meetingsData.message
        );
      }

      // ---------------- STUDENTS ----------------

      const studentsResponse = await fetch(
        "http://localhost:5000/api/students",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const studentsData =
        await studentsResponse.json();

      if (studentsResponse.ok) {
        setStudents(
          studentsData.students || []
        );
      } else {
        console.error(
          "Failed to fetch students:",
          studentsData.message
        );
      }
    } catch (error) {
      console.error(
        "Fetch data error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  fetchData();
}, [fetchData]);

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem(
      "trackwiseToken"
    );

    localStorage.removeItem(
      "trackwiseUser"
    );

    navigate("/login");
  };

  // =========================================================
  // RESET FORM
  // =========================================================

  const resetMeetingForm = () => {
    setMeetingForm({
      studentId: "",
      title: "",
      date: "",
      time: "",
      mode: "Online",
      notes: "",
    });

    setEditingMeeting(null);
  };

  // =========================================================
  // OPEN SCHEDULE FORM
  // =========================================================

  const openScheduleForm = () => {
    resetMeetingForm();
    setShowScheduleForm(true);
  };

  // =========================================================
  // CLOSE FORM
  // =========================================================

  const closeScheduleForm = () => {
    setShowScheduleForm(false);
    resetMeetingForm();
  };

  // =========================================================
  // EDIT MEETING
  // =========================================================

  const handleEditMeeting = (meeting) => {
    const meetingDate =
      new Date(meeting.date);

    const year =
      meetingDate.getFullYear();

    const month = String(
      meetingDate.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      meetingDate.getDate()
    ).padStart(2, "0");

    const hours = String(
      meetingDate.getHours()
    ).padStart(2, "0");

    const minutes = String(
      meetingDate.getMinutes()
    ).padStart(2, "0");

    setMeetingForm({
      studentId:
        meeting.student?._id || "",

      title:
        meeting.title || "",

      date:
        `${year}-${month}-${day}`,

      time:
        `${hours}:${minutes}`,

      mode:
        meeting.mode || "Online",

      notes:
        meeting.notes || "",
    });

    setEditingMeeting(meeting);
    setShowScheduleForm(true);
  };

  // =========================================================
  // CREATE / UPDATE MEETING
  // =========================================================

  const handleScheduleMeeting =
    async (e) => {
      e.preventDefault();

      if (
        !meetingForm.studentId ||
        !meetingForm.title ||
        !meetingForm.date ||
        !meetingForm.time
      ) {
        alert(
          "Please fill all required fields."
        );

        return;
      }

      try {
        setSubmitting(true);

        const token =
          localStorage.getItem(
            "trackwiseToken"
          );

        const meetingDateTime =
          new Date(
            `${meetingForm.date}T${meetingForm.time}`
          );

        const url = editingMeeting
          ? `http://localhost:5000/api/meetings/${editingMeeting._id}`
          : "http://localhost:5000/api/meetings";

        const method = editingMeeting
          ? "PUT"
          : "POST";

        const response = await fetch(
          url,
          {
            method,
            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              studentId:
                meetingForm.studentId,

              title:
                meetingForm.title,

              date:
                meetingDateTime.toISOString(),

              mode:
                meetingForm.mode,

              notes:
                meetingForm.notes,
            }),
          }
        );

        const data =
          await response.json();

        if (response.ok) {
          alert(
            editingMeeting
              ? "Meeting updated successfully!"
              : "Meeting scheduled successfully!"
          );

          closeScheduleForm();

          await fetchData();
        } else {
          alert(
            data.message ||
              "Failed to save meeting."
          );
        }
      } catch (error) {
        console.error(
          "Schedule/update meeting error:",
          error
        );

        alert(
          "Something went wrong while saving the meeting."
        );
      } finally {
        setSubmitting(false);
      }
    };

  // =========================================================
  // DELETE MEETING
  // =========================================================

  const handleDeleteMeeting =
    async (meetingId) => {
      const confirmDelete =
        window.confirm(
          "Are you sure you want to delete this meeting?"
        );

      if (!confirmDelete) {
        return;
      }

      try {
        const token =
          localStorage.getItem(
            "trackwiseToken"
          );

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(
          `http://localhost:5000/api/meetings/${meetingId}`,
          {
            method: "DELETE",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        const data =
          await response.json();

        if (response.ok) {
          alert(
            "Meeting deleted successfully!"
          );

          await fetchData();
        } else {
          alert(
            data.message ||
              "Failed to delete meeting."
          );
        }
      } catch (error) {
        console.error(
          "Delete meeting error:",
          error
        );

        alert(
          "Something went wrong while deleting the meeting."
        );
      }
    };

  // =========================================================
  // DATE FORMAT
  // =========================================================

  const formatDate = (date) => {
    return new Date(
      date
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    return new Date(
      date
    ).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredMeetings =
    meetings.filter((meeting) => {
      const studentName =
        meeting.student?.fullName || "";

      const title =
        meeting.title || "";

      const rollNumber =
        meeting.student?.rollNumber || "";

      const searchText =
        search.toLowerCase();

      return (
        studentName
          .toLowerCase()
          .includes(searchText) ||
        title
          .toLowerCase()
          .includes(searchText) ||
        rollNumber
          .toLowerCase()
          .includes(searchText)
      );
    });

  // =========================================================
  // TODAY
  // =========================================================

  const today = new Date();

  const todayMeetings =
    meetings.filter((meeting) => {
      const meetingDate =
        new Date(meeting.date);

      return (
        meetingDate.toDateString() ===
        today.toDateString()
      );
    });

  // =========================================================
  // STATS
  // =========================================================

  const totalMeetings =
    meetings.length;

  const scheduledMeetings =
    meetings.filter(
      (meeting) =>
        meeting.status === "Scheduled"
    ).length;

  const completedMeetings =
    meetings.filter(
      (meeting) =>
        meeting.status === "Completed"
    ).length;

  // =========================================================
  // CALENDAR
  // =========================================================

  const getDaysInMonth = () => {
    const year =
      currentMonth.getFullYear();

    const month =
      currentMonth.getMonth();

    const firstDay =
      new Date(
        year,
        month,
        1
      ).getDay();

    const daysInMonth =
      new Date(
        year,
        month + 1,
        0
      ).getDate();

    const days = [];

    for (
      let i = 0;
      i < firstDay;
      i++
    ) {
      days.push(null);
    }

    for (
      let i = 1;
      i <= daysInMonth;
      i++
    ) {
      days.push(i);
    }

    return days;
  };

  const hasMeetingOnDay = (
    day
  ) => {
    if (!day) {
      return false;
    }

    const year =
      currentMonth.getFullYear();

    const month =
      currentMonth.getMonth();

    return meetings.some(
      (meeting) => {
        const meetingDate =
          new Date(meeting.date);

        return (
          meetingDate.getFullYear() ===
            year &&
          meetingDate.getMonth() ===
            month &&
          meetingDate.getDate() ===
            day
        );
      }
    );
  };

  const previousMonth = () => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1
      )
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1
      )
    );
  };

  const monthName =
    currentMonth.toLocaleDateString(
      "en-IN",
      {
        month: "long",
        year: "numeric",
      }
    );

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="meeting-loading">
        Loading meetings...
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  // ================= Export meetings (CSV) =================

  const handleExportMeetings = () => {
    const cell = (value) => {
      let text = String(value ?? "");
      if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = [
      ["Title", "Student", "Roll Number", "Date", "Mode", "Status", "Notes"],
      ...meetings.map((m) => [
        m.title,
        m.student?.fullName,
        m.student?.rollNumber,
        new Date(m.date).toLocaleString("en-IN"),
        m.mode,
        m.status,
        m.notes,
      ]),
    ];

    const csv = rows.map((row) => row.map(cell).join(",")).join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = "meetings.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="meeting-page">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="sidebar">

        <div>

          <div className="sidebar-logo">
            <h2>TrackWise</h2>
          </div>

          <nav className="sidebar-nav">

            <Link to="/mentor-dashboard">
              <FaHome />
              <span>Dashboard</span>
            </Link>

            <Link to="/my-mentees">
              <FaUsers />
              <span>My Mentees</span>
            </Link>

            <Link to="/at-risk">
              <FaExclamationTriangle />
              <span>
                At Risk Students
              </span>
            </Link>

            <Link
              to="/meetings"
              className="active"
            >
              <FaCalendarAlt />
              <span>Meetings</span>
            </Link>

            <Link to="/bulk-alerts">
              <FaBell />
              <span>Bulk Alerts</span>
            </Link>

            <Link to="/reports">
              <FaChartBar />
              <span>Reports</span>
            </Link>

            <Link to="/profile">
              <FaUserCircle />
              <span>Profile</span>
            </Link>

          </nav>

        </div>

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          Logout
        </button>

      </aside>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="meeting-main">

        {/* HEADER */}

        <div className="meeting-header">

          <div>
            <h1>Meetings</h1>

            <p>
              Schedule and manage meetings
              with your mentees
            </p>
          </div>

          <button
            className="schedule-btn"
            onClick={openScheduleForm}
          >
            <FaPlus />
            Schedule Meeting
          </button>

        </div>

        {/* ===================================================
            STATS
        =================================================== */}

        <div className="meeting-stats">

          <div className="stat-card">

            <div className="stat-icon">
              <FaCalendarAlt />
            </div>

            <div>
              <h3>
                {totalMeetings}
              </h3>

              <p>
                Total Meetings
              </p>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              <FaClock />
            </div>

            <div>
              <h3>
                {scheduledMeetings}
              </h3>

              <p>
                Scheduled
              </p>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              <FaUsers />
            </div>

            <div>
              <h3>
                {todayMeetings.length}
              </h3>

              <p>
                Today
              </p>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              <FaVideo />
            </div>

            <div>
              <h3>
                {completedMeetings}
              </h3>

              <p>
                Completed
              </p>
            </div>

          </div>

        </div>

        {/* ===================================================
            SEARCH
        =================================================== */}

        <div className="meeting-toolbar">

          <div className="search-box">

            <FaSearch />

            <input
              type="text"
              placeholder="Search meetings, students or roll number..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </div>

        </div>

        {/* ===================================================
            MEETINGS TABLE
        =================================================== */}

        <section className="meeting-section">

          <div className="section-header">

            <div>
              <h2>
                Upcoming Meetings
              </h2>

              <p>
                Your scheduled meetings
              </p>
            </div>

          </div>

          <div className="meeting-table-container">

            {filteredMeetings.length ===
            0 ? (

              <div className="empty-state">

                <FaCalendarAlt />

                <h3>
                  No meetings found
                </h3>

                <p>
                  Schedule a meeting with
                  one of your mentees.
                </p>

              </div>

            ) : (

              <table className="meeting-table">

                <thead>

                  <tr>

                    <th>
                      Student
                    </th>

                    <th>
                      Meeting
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Time
                    </th>

                    <th>
                      Mode
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredMeetings.map(
                    (meeting) => (

                      <tr
                        key={
                          meeting._id
                        }
                      >

                        {/* STUDENT */}

                        <td>

                          <div className="student-info">

                            <div className="student-avatar">
                              {meeting
                                .student
                                ?.fullName
                                ?.charAt(0)
                                ?.toUpperCase()}
                            </div>

                            <div>

                              <strong>
                                {
                                  meeting
                                    .student
                                    ?.fullName
                                }
                              </strong>

                              <span>
                                {
                                  meeting
                                    .student
                                    ?.rollNumber
                                }
                              </span>

                            </div>

                          </div>

                        </td>

                        {/* TITLE */}

                        <td>

                          <strong>
                            {
                              meeting.title
                            }
                          </strong>

                        </td>

                        {/* DATE */}

                        <td>
                          {formatDate(
                            meeting.date
                          )}
                        </td>

                        {/* TIME */}

                        <td>
                          {formatTime(
                            meeting.date
                          )}
                        </td>

                        {/* MODE */}

                        <td>

                          <span className="mode-badge">

                            {meeting.mode ===
                            "Online" ? (
                              <FaVideo />
                            ) : (
                              <FaUsers />
                            )}

                            {
                              meeting.mode
                            }

                          </span>

                        </td>

                        {/* STATUS */}

                        <td>

                          <span
                            className={`status-badge ${
                              meeting.status
                                ?.toLowerCase()
                                .replace(
                                  " ",
                                  "-"
                                )
                            }`}
                          >
                            {
                              meeting.status
                            }
                          </span>

                        </td>

                        {/* ACTIONS */}

                        <td>

                          {/* VIEW */}

                          <button
                            className="icon-btn"
                            title="View Meeting"
                            onClick={() =>
                              alert(
                                `Meeting: ${
                                  meeting.title
                                }
Student: ${
                                  meeting
                                    .student
                                    ?.fullName
                                }
Date: ${formatDate(
                                  meeting.date
                                )}
Time: ${formatTime(
                                  meeting.date
                                )}
Mode: ${
                                  meeting.mode
                                }
Status: ${
                                  meeting.status
                                }
Notes: ${
                                  meeting.notes ||
                                  "No notes"
                                }`
                              )
                            }
                          >
                            <FaEye />
                          </button>

                          {/* EDIT */}

                          <button
                            className="icon-btn edit-btn"
                            title="Edit Meeting"
                            onClick={() =>
                              handleEditMeeting(
                                meeting
                              )
                            }
                          >
                            <FaEdit />
                          </button>

                          {/* DELETE */}

                          <button
                            className="icon-btn delete-btn"
                            title="Delete Meeting"
                            onClick={() =>
                              handleDeleteMeeting(
                                meeting._id
                              )
                            }
                          >
                            <FaTrash />
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            )}

          </div>

        </section>

        {/* ===================================================
            BOTTOM GRID
        =================================================== */}

        <div className="meeting-bottom-grid">

          {/* CALENDAR */}

          <section className="calendar-card">

            <div className="calendar-header">

              <button
                onClick={
                  previousMonth
                }
              >
                <FaChevronLeft />
              </button>

              <h2>
                {monthName}
              </h2>

              <button
                onClick={
                  nextMonth
                }
              >
                <FaChevronRight />
              </button>

            </div>

            <div className="calendar-weekdays">

              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>

            </div>

            <div className="calendar-days">

              {getDaysInMonth().map(
                (day, index) => (

                  <div
                    key={index}
                    className={`calendar-day ${
                      day &&
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth(),
                        day
                      ).toDateString() ===
                        today.toDateString()
                        ? "today"
                        : ""
                    } ${
                      hasMeetingOnDay(day)
                        ? "has-meeting"
                        : ""
                    }`}
                  >

                    {day}

                    {hasMeetingOnDay(
                      day
                    ) && (

                      <span className="meeting-dot">
                        •
                      </span>

                    )}

                  </div>

                )
              )}

            </div>

          </section>

          {/* TODAY'S SCHEDULE */}

          <section className="today-card">

            <div className="section-header">

              <div>

                <h2>
                  Today's Schedule
                </h2>

                <p>
                  {todayMeetings.length}{" "}
                  meeting
                  {todayMeetings.length !==
                  1
                    ? "s"
                    : ""}
                </p>

              </div>

            </div>

            {todayMeetings.length ===
            0 ? (

              <div className="today-empty">

                <FaCalendarAlt />

                <p>
                  No meetings scheduled
                  for today.
                </p>

              </div>

            ) : (

              <div className="today-list">

                {todayMeetings.map(
                  (meeting) => (

                    <div
                      className="today-meeting"
                      key={
                        meeting._id
                      }
                    >

                      <div className="today-time">

                        {formatTime(
                          meeting.date
                        )}

                      </div>

                      <div className="today-details">

                        <strong>
                          {
                            meeting.title
                          }
                        </strong>

                        <span>
                          {
                            meeting
                              .student
                              ?.fullName
                          }
                        </span>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </section>

        </div>

        {/* ===================================================
            QUICK ACTIONS
        =================================================== */}

        <section className="quick-actions">

          <h2>
            Quick Actions
          </h2>

          <div className="quick-action-grid">

            <button
              onClick={
                openScheduleForm
              }
            >

              <FaPlus />

              <span>
                Schedule Meeting
              </span>

            </button>

            <button
              onClick={handleExportMeetings}
            >

              <FaDownload />

              <span>
                Export Meetings
              </span>

            </button>

            

            <button
              onClick={() =>
                alert(
                  "Notes can be added while scheduling or editing a meeting."
                )
              }
            >

              <FaStickyNote />

              <span>
                Add Notes
              </span>

            </button>

          </div>

        </section>

      </main>

      {/* =====================================================
          SCHEDULE / EDIT MODAL
      ===================================================== */}

      {showScheduleForm && (

        <div className="meeting-modal-overlay">

          <div className="meeting-modal">

            <div className="meeting-modal-header">

              <h2>
                {editingMeeting
                  ? "Edit Meeting"
                  : "Schedule New Meeting"}
              </h2>

              <button
                className="modal-close-btn"
                onClick={
                  closeScheduleForm
                }
              >
                <FaTimes />
              </button>

            </div>

            <form
              onSubmit={
                handleScheduleMeeting
              }
            >

              {/* STUDENT */}

              <div className="form-group">

                <label>
                  Select Student *
                </label>

                <select
                  value={
                    meetingForm.studentId
                  }
                  onChange={(e) =>
                    setMeetingForm({
                      ...meetingForm,
                      studentId:
                        e.target.value,
                    })
                  }
                  required
                >

                  <option value="">
                    Select a student
                  </option>

                  {students.map(
                    (student) => (

                      <option
                        key={
                          student._id
                        }
                        value={
                          student._id
                        }
                      >
                        {
                          student.fullName
                        }{" "}
                        (
                        {
                          student.rollNumber
                        }
                        )
                      </option>

                    )
                  )}

                </select>

              </div>

              {/* TITLE */}

              <div className="form-group">

                <label>
                  Meeting Title *
                </label>

                <input
                  type="text"
                  placeholder="e.g. Academic Progress Discussion"
                  value={
                    meetingForm.title
                  }
                  onChange={(e) =>
                    setMeetingForm({
                      ...meetingForm,
                      title:
                        e.target.value,
                    })
                  }
                  required
                />

              </div>

              {/* DATE + TIME */}

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Date *
                  </label>

                  <input
                    type="date"
                    value={
                      meetingForm.date
                    }
                    onChange={(e) =>
                      setMeetingForm({
                        ...meetingForm,
                        date:
                          e.target.value,
                      })
                    }
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Time *
                  </label>

                  <input
                    type="time"
                    value={
                      meetingForm.time
                    }
                    onChange={(e) =>
                      setMeetingForm({
                        ...meetingForm,
                        time:
                          e.target.value,
                      })
                    }
                    required
                  />

                </div>

              </div>

              {/* MODE */}

              <div className="form-group">

                <label>
                  Meeting Mode
                </label>

                <select
                  value={
                    meetingForm.mode
                  }
                  onChange={(e) =>
                    setMeetingForm({
                      ...meetingForm,
                      mode:
                        e.target.value,
                    })
                  }
                >

                  <option value="Online">
                    Online
                  </option>

                  <option value="Offline">
                    Offline
                  </option>

                </select>

              </div>

              {/* NOTES */}

              <div className="form-group">

                <label>
                  Notes
                </label>

                <textarea
                  rows="4"
                  placeholder="Add meeting notes..."
                  value={
                    meetingForm.notes
                  }
                  onChange={(e) =>
                    setMeetingForm({
                      ...meetingForm,
                      notes:
                        e.target.value,
                    })
                  }
                />

              </div>

              {/* BUTTONS */}

              <div className="form-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={
                    closeScheduleForm
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submit-meeting-btn"
                  disabled={
                    submitting
                  }
                >
                  {submitting
                    ? "Saving..."
                    : editingMeeting
                    ? "Update Meeting"
                    : "Schedule Meeting"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default MeetingDashboard;