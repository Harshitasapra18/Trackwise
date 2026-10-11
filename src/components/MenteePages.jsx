import MenteeSidebar from "./MenteeSidebar";

/* =========================
   MARKS PAGE
========================= */

import { useEffect, useState } from "react";

export function Marks() {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMarks = async () => {
      try {
        const token =
          localStorage.getItem("trackwiseToken");

        if (!token) {
          setError("Please login again.");
          setLoading(false);
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/marks/mentee/me",
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
          setMarks(data.marks || []);
          setError("");
        } else {
          setError(
            data.message || "Unable to fetch marks."
          );
        }
      } catch (error) {
        console.error(
          "Error fetching marks:",
          error
        );

        setError(
          "Unable to connect to TrackWise server."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMarks();
  }, []);

  // =========================================================
  // CURRENT SEMESTER
  // =========================================================

  const currentSemester =
    marks.length > 0
      ? Math.max(
          ...marks.map(
            (mark) => Number(mark.semester)
          )
        )
      : null;

  const currentSemesterMarks =
    currentSemester
      ? marks.filter(
          (mark) =>
            Number(mark.semester) ===
            currentSemester
        )
      : [];

  // =========================================================
  // TOTAL SUBJECTS
  // =========================================================

  const totalSubjects =
    currentSemesterMarks.length;

  // =========================================================
  // TOTAL MARKS
  // =========================================================

  const totalMarks =
    currentSemesterMarks.reduce(
      (sum, mark) =>
        sum + Number(mark.totalMarks || 0),
      0
    );

  const totalMax =
    currentSemesterMarks.reduce(
      (sum, mark) =>
        sum + Number(mark.totalMax || 100),
      0
    );

  // =========================================================
  // PERCENTAGE
  // =========================================================

  const percentage =
    totalMax > 0
      ? (
          (totalMarks / totalMax) *
          100
        ).toFixed(2)
      : "0.00";

  // =========================================================
  // BEST SUBJECT
  // =========================================================

  const bestSubject =
    currentSemesterMarks.length > 0
      ? [...currentSemesterMarks].sort(
          (a, b) =>
            Number(b.totalMarks) -
            Number(a.totalMarks)
        )[0].subject
      : "N/A";

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <Page
        title="Marks"
        subtitle="View your semester-wise academic performance"
      >
        <div className="mentee-table-card">
          <h3>Loading marks...</h3>
        </div>
      </Page>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <Page
        title="Marks"
        subtitle="View your semester-wise academic performance"
      >
        <div className="mentee-table-card">
          <h3>Unable to load marks</h3>

          <p className="muted">
            {error}
          </p>
        </div>
      </Page>
    );
  }

  // =========================================================
  // NO MARKS
  // =========================================================

  if (marks.length === 0) {
    return (
      <Page
        title="Marks"
        subtitle="View your semester-wise academic performance"
      >
        <div className="mentee-card-grid">

          <Card
            t="Current Percentage"
            v="N/A"
          />

          <Card
            t="Best Subject"
            v="N/A"
          />

          <Card
            t="Total Subjects"
            v="0"
          />

        </div>

        <div className="mentee-table-card">

          <h3>No Marks Available</h3>

          <p className="muted">
            Your mentor has not added any
            marks yet.
          </p>

        </div>
      </Page>
    );
  }

  // =========================================================
  // MARKS PAGE
  // =========================================================

  return (
    <Page
      title="Marks"
      subtitle="View your semester-wise academic performance"
    >

      {/* SUMMARY CARDS */}

      <div className="mentee-card-grid">

        <Card
          t="Current Percentage"
          v={`${percentage}%`}
        />

        <Card
          t="Best Subject"
          v={bestSubject}
        />

        <Card
          t="Total Subjects"
          v={totalSubjects}
        />

      </div>


      {/* MARKS TABLE */}

      <div className="mentee-table-card">

        <h3>
          Semester {currentSemester} Marks
        </h3>

        <table className="mentee-table">

          <thead>

            <tr>
              <th>Subject</th>
              <th>Internal</th>
              <th>External</th>
              <th>Total</th>
              <th>Grade</th>
            </tr>

          </thead>

          <tbody>

            {currentSemesterMarks.map(
              (mark) => (

                <tr key={mark._id}>

                  <td>

                    <strong>
                      {mark.subject}
                    </strong>

                    {mark.subjectCode && (
                      <div
                        className="muted"
                        style={{
                          fontSize: "12px",
                        }}
                      >
                        {mark.subjectCode}
                      </div>
                    )}

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
                    <span className="badge green">
                      {mark.grade}
                    </span>
                  </td>

                </tr>

              )
            )}

          </tbody>

        </table>

      </div>

    </Page>
  );
}

/* =========================
   SHARED DATA HELPER
========================= */

const API = "http://localhost:5000/api";

function useMenteeData(paths) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const [reloadKey, setReloadKey] = useState(0);
  const key = paths.join("|");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const token = localStorage.getItem("trackwiseToken");

        const results = await Promise.all(
          paths.map(async (path) => {
            const response = await fetch(`${API}${path}`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (response.status === 401) {
              localStorage.removeItem("trackwiseToken");
              localStorage.removeItem("trackwiseUser");
              window.location.assign("/login");
              throw new Error("Session expired");
            }

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || "Unable to load data");
            }

            return data;
          })
        );

        if (!cancelled) setState({ data: results, loading: false, error: "" });
      } catch (error) {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: error.message || "Unable to connect to the server",
          });
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reloadKey]);

  return { ...state, reload: () => setReloadKey((n) => n + 1) };
}

function Status({ loading, error, children }) {
  if (loading) {
    return (
      <div className="mentee-table-card">
        <h3>Loading...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mentee-table-card">
        <h3>Unable to load this page</h3>
        <p className="muted">{error}</p>
      </div>
    );
  }

  return children;
}

const pct = (attended, total) =>
  total > 0 ? Math.round((attended / total) * 100) : 0;

/* =========================
   ATTENDANCE PAGE
========================= */

export function Attendance() {
  const { data, loading, error } = useMenteeData([
    "/attendance/mentee/me",
    "/students/mentee/summary",
  ]);

  const records = data ? data[0].attendance : [];
  const summary = data ? data[1].summary : null;

  const percents = records.map((r) => pct(r.attendedClasses, r.totalClasses));

  const statusOf = (p) => (p < 75 ? "Low" : p < 90 ? "Good" : "Excellent");

  // classes that must be attended in a row to reach 75%
  const needed = (r) => {
    const p = pct(r.attendedClasses, r.totalClasses);
    if (p >= 75) return "-";
    return String(Math.ceil((0.75 * r.totalClasses - r.attendedClasses) / 0.25));
  };

  return (
    <Page title="Attendance" subtitle="Track attendance subject-wise">
      <Status loading={loading} error={error}>
        <div className="mentee-card-grid">
          <Card t="Overall Attendance" v={records.length ? `${summary.overallAttendance}%` : "N/A"} />
          <Card t="Best Attendance" v={records.length ? `${Math.max(...percents)}%` : "N/A"} />
          <Card t="Lowest Attendance" v={records.length ? `${Math.min(...percents)}%` : "N/A"} />
        </div>

        {records.length === 0 ? (
          <div className="mentee-table-card">
            <h3>No attendance yet</h3>
            <p className="muted">Your mentor has not entered attendance for any subject yet.</p>
          </div>
        ) : (
          <Table
            title="Subject Attendance"
            headers={["Subject", "Sem", "Classes", "Present", "Attendance", "Classes needed for 75%", "Status"]}
            rows={records.map((r) => [
              `${r.subject}${r.subjectCode ? ` (${r.subjectCode})` : ""}`,
              r.semester,
              r.totalClasses,
              r.attendedClasses,
              `${pct(r.attendedClasses, r.totalClasses)}%`,
              needed(r),
              statusOf(pct(r.attendedClasses, r.totalClasses)),
            ])}
          />
        )}
      </Status>
    </Page>
  );
}

/* =========================
   CGPA TRACKER PAGE
========================= */

export function CGPATracker() {
  const { data, loading, error } = useMenteeData(["/students/mentee/summary"]);

  const summary = data ? data[0].summary : null;
  const targets = data ? data[0].targets : null;
  const trend = summary ? summary.semesterGpa : [];

  const gap = summary && targets ? Math.round((targets.targetCgpa - summary.cgpa) * 100) / 100 : 0;

  return (
    <Page title="CGPA Tracker" subtitle="Monitor your performance semester by semester">
      <Status loading={loading} error={error}>
        <div className="mentee-card-grid">
          <Card t="Current CGPA" v={trend.length ? summary.cgpa.toFixed(2) : "N/A"} />
          <Card t="Target CGPA" v={targets.targetCgpa.toFixed(2)} />
          <Card
            t="Required Improvement"
            v={!trend.length ? "N/A" : gap > 0 ? `+${gap.toFixed(2)}` : "Target met"}
          />
        </div>

        <div className="mentee-table-card">
          <h3>SGPA Trend</h3>

          {trend.length === 0 ? (
            <p className="muted">Your CGPA will appear here once marks are entered.</p>
          ) : (
            <div
              style={{
                height: "230px",
                display: "flex",
                alignItems: "flex-end",
                gap: "25px",
                padding: "25px 10px",
              }}
            >
              {trend.map((item) => (
                <div key={item.semester} style={{ flex: 1, textAlign: "center" }}>
                  <div
                    style={{
                      height: `${Math.max(6, (item.sgpa / 10) * 170)}px`,
                      background: "#4f46e5",
                      borderRadius: "8px 8px 0 0",
                      marginBottom: "8px",
                    }}
                  ></div>
                  <b>{item.sgpa.toFixed(2)}</b>
                  <div className="muted">Sem {item.semester}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Status>
    </Page>
  );
}

/* =========================
   ACADEMIC TARGET PAGE
========================= */

export function AcademicTarget() {
  const { data, loading, error, reload } = useMenteeData(["/students/mentee/summary"]);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const summary = data ? data[0].summary : null;
  const targets = data ? data[0].targets : null;

  const values = form || (targets
    ? { targetCgpa: targets.targetCgpa, targetAttendance: targets.targetAttendance }
    : { targetCgpa: "", targetAttendance: "" });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const token = localStorage.getItem("trackwiseToken");

      const response = await fetch(`${API}/students/mentee/targets`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          targetCgpa: Number(values.targetCgpa),
          targetAttendance: Number(values.targetAttendance),
        }),
      });

      const result = await response.json();
      setMessage(response.ok ? "Targets saved" : result.message || "Unable to save");

      if (response.ok) {
        setForm(null);
        reload();
      }
    } catch {
      setMessage("Unable to connect to the server");
    } finally {
      setSaving(false);
    }
  };

  const hasMarks = summary && summary.subjectsWithMarks > 0;
  const cgpaProgress = hasMarks && targets.targetCgpa > 0
    ? Math.min(100, Math.round((summary.cgpa / targets.targetCgpa) * 100)) : 0;
  const attProgress = summary && targets.targetAttendance > 0
    ? Math.min(100, Math.round((summary.overallAttendance / targets.targetAttendance) * 100)) : 0;

  const inputStyle = { padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px", width: "120px" };

  return (
    <Page title="Academic Target" subtitle="Set goals and track your progress">
      <Status loading={loading} error={error}>
        <div className="mentee-card-grid">
          <Card t="Target CGPA" v={targets.targetCgpa.toFixed(2)} />
          <Card t="Current CGPA" v={hasMarks ? summary.cgpa.toFixed(2) : "N/A"} />
          <Card t="Progress" v={hasMarks ? `${cgpaProgress}%` : "N/A"} />
        </div>

        <div className="mentee-two">
          <div className="mentee-card">
            <h3>CGPA Goal</h3>
            <div className="target-box">
              <b>{targets.targetCgpa.toFixed(2)} CGPA</b>
              <p className="muted">
                {!hasMarks
                  ? "Progress will show once marks are entered."
                  : summary.cgpa >= targets.targetCgpa
                  ? "You have reached your target. Keep it up!"
                  : `You need +${(targets.targetCgpa - summary.cgpa).toFixed(2)} more to reach your target.`}
              </p>
              <div className="progress-bar" style={{ marginTop: "15px" }}>
                <span style={{ width: `${cgpaProgress}%` }}></span>
              </div>
            </div>
          </div>

          <div className="mentee-card">
            <h3>Attendance Goal</h3>
            <div className="target-box">
              <b>Maintain {targets.targetAttendance}%+ overall</b>
              <p className="muted">
                {summary.flags.filter((f) => f.startsWith("Low attendance")).length > 0
                  ? summary.flags.filter((f) => f.startsWith("Low attendance")).join(", ")
                  : "No subject is below 75%."}
              </p>
              <div className="progress-bar" style={{ marginTop: "15px" }}>
                <span style={{ width: `${attProgress}%` }}></span>
              </div>
            </div>
          </div>
        </div>

        <div className="mentee-card" style={{ marginTop: "20px" }}>
          <h3>Update my targets</h3>
          <form onSubmit={save} style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
            <label>
              Target CGPA{" "}
              <input type="number" step="0.1" min="0" max="10" style={inputStyle}
                value={values.targetCgpa}
                onChange={(e) => setForm({ ...values, targetCgpa: e.target.value })} required />
            </label>
            <label>
              Target attendance %{" "}
              <input type="number" step="1" min="0" max="100" style={inputStyle}
                value={values.targetAttendance}
                onChange={(e) => setForm({ ...values, targetAttendance: e.target.value })} required />
            </label>
            <button type="submit" disabled={saving}
              style={{ padding: "10px 18px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>
              {saving ? "Saving..." : "Save targets"}
            </button>
            {message && <span className="muted">{message}</span>}
          </form>
        </div>
      </Status>
    </Page>
  );
}

/* =========================
   BATCH COMPARISON PAGE
========================= */

export function BatchComparison() {
  const { data, loading, error } = useMenteeData(["/students/mentee/batch"]);
  const batch = data ? data[0] : null;

  const position = (you, avg) =>
    you > avg ? "Above Average" : you < avg ? "Below Average" : "Average";

  return (
    <Page title="Batch Comparison" subtitle="Compare your performance with your batch (anonymous)">
      <Status loading={loading} error={error}>
        {!batch.available ? (
          <div className="mentee-table-card">
            <h3>Comparison not available</h3>
            <p className="muted">{batch.reason}</p>
          </div>
        ) : (
          <>
            <div className="mentee-card-grid">
              <Card t="Your CGPA" v={batch.you.cgpa.toFixed(2)} />
              <Card t="Batch Average" v={batch.average.cgpa.toFixed(2)} />
              <Card t="Your Rank" v={`#${batch.rank} of ${batch.batchSize}`} />
            </div>

            <Table
              title="Performance Comparison"
              headers={["Metric", "You", "Batch Average", "Position"]}
              rows={[
                ["CGPA", batch.you.cgpa.toFixed(2), batch.average.cgpa.toFixed(2), position(batch.you.cgpa, batch.average.cgpa)],
                ["Attendance", `${batch.you.attendance}%`, `${batch.average.attendance}%`, position(batch.you.attendance, batch.average.attendance)],
              ]}
            />
          </>
        )}
      </Status>
    </Page>
  );
}

/* =========================
   ALERTS PAGE
========================= */

export function Alerts() {
  const { data, loading, error } = useMenteeData([
    "/alerts/mentee/me",
    "/meetings/mentee/me",
    "/students/mentee/summary",
  ]);

  const alerts = data ? data[0].alerts : [];
  const meetings = data ? data[1].meetings : [];
  const summary = data ? data[2].summary : null;

  const upcoming = meetings.filter(
    (m) => (m.status === "Scheduled" || m.status === "Pending") && new Date(m.date) > new Date()
  );

  const fmt = (d) => new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  return (
    <Page title="Alerts" subtitle="Important academic notifications">
      <Status loading={loading} error={error}>
        <div className="mentee-table-card">
          <h3>Automatic Warnings</h3>
          <div style={{ marginTop: "18px" }}>
            {summary.flags.length === 0 && (
              <div className="alert-item"><b>All good</b><p>No academic warnings right now.</p></div>
            )}
            {summary.flags.map((flag) => (
              <div className="alert-item" key={flag}><b>{flag}</b></div>
            ))}
          </div>
        </div>

        <div className="mentee-table-card" style={{ marginTop: "20px" }}>
          <h3>Messages from your mentor</h3>
          <div style={{ marginTop: "18px" }}>
            {alerts.length === 0 && <p className="muted">No alerts from your mentor yet.</p>}
            {alerts.map((a) => (
              <div className="alert-item" key={a._id}>
                <b>{a.subject}</b> <span className="muted">({a.type} • {a.priority})</span>
                <p>{a.message}</p>
                <small className="muted">
                  {a.mentor?.fullName ? `${a.mentor.fullName} • ` : ""}{fmt(a.createdAt)}
                </small>
              </div>
            ))}
          </div>
        </div>

        <div className="mentee-table-card" style={{ marginTop: "20px" }}>
          <h3>Upcoming Meetings</h3>
          <div style={{ marginTop: "18px" }}>
            {upcoming.length === 0 && <p className="muted">No upcoming meetings.</p>}
            {upcoming.map((m) => (
              <div className="alert-item" key={m._id}>
                <b>{m.title}</b>
                <p>{fmt(m.date)} • {m.mode}{m.mentor?.fullName ? ` • with ${m.mentor.fullName}` : ""}</p>
              </div>
            ))}
          </div>
        </div>
      </Status>
    </Page>
  );
}

/* =========================
   MENTEE PROFILE PAGE
========================= */

export function MenteeProfile() {
  const { data, loading, error } = useMenteeData([
    "/students/mentee/me",
    "/students/mentee/summary",
  ]);

  const student = data ? data[0].student : null;
  const summary = data ? data[1].summary : null;

  const initials = student
    ? student.fullName.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "";

  return (
    <Page title="Profile" subtitle="Your student profile">
      <Status loading={loading} error={error}>
        <div className="profile-box">
          <div
            style={{
              width: "100px", height: "100px", borderRadius: "50%", background: "#4f46e5",
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "34px", fontWeight: "700",
            }}
          >
            {initials}
          </div>
          <div>
            <h2>{student.fullName}</h2>
            <p className="muted">
              {student.rollNumber} • {student.course?.name || student.department || "Course not set"} • Semester {student.semester}
            </p>
          </div>
        </div>

        <div className="mentee-two">
          <div className="mentee-card">
            <h3>Personal Details</h3>
            <p><b>Email:</b> {student.email}</p>
            <p><b>Course:</b> {student.course?.name || "Not set"}</p>
            <p><b>Mentor:</b> {student.mentor?.fullName || "Not assigned"}</p>
          </div>

          <div className="mentee-card">
            <h3>Academic Details</h3>
            <p><b>CGPA:</b> {summary.subjectsWithMarks ? summary.cgpa.toFixed(2) : "N/A"}</p>
            <p><b>Attendance:</b> {summary.overallAttendance}%</p>
            <p><b>Credits earned:</b> {summary.earnedCredits}</p>
            <p><b>Backlogs:</b> {summary.backlogCount}</p>
            <p><b>Status:</b> {summary.riskStatus}</p>
          </div>
        </div>
      </Status>
    </Page>
  );
}

/* =========================
   COMMON PAGE
========================= */

function Page({
  title,
  subtitle,
  children,
}) {
  const userName =
    JSON.parse(localStorage.getItem("trackwiseUser") || "{}").fullName ||
    "Mentee";

  return (
    <>
      <MenteeSidebar />

      <main className="mentee-page">

        <header className="mentee-page-header">

          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <div>
            🔔 &nbsp;
            <b>{userName}</b>
          </div>

        </header>

        {children}

      </main>
    </>
  );
}

/* =========================
   COMMON CARD
========================= */

function Card({ t, v }) {
  return (
    <div className="mentee-card">
      <h3>{t}</h3>

      <div className="mentee-value">
        {v}
      </div>
    </div>
  );
}

/* =========================
   COMMON TABLE
========================= */

function Table({
  title,
  headers,
  rows,
}) {
  return (
    <div className="mentee-table-card">

      <h3>{title}</h3>

      <table className="mentee-table">

        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>

              {row.map((value, columnIndex) => {

                const isLastColumn =
                  columnIndex === row.length - 1;

                const text =
                  String(value);

                let badgeClass = "blue";

                if (/low|risk|below|backlog/i.test(text)) {
                  badgeClass = "red";
                } else if (/good|excellent|safe|above/i.test(text)) {
                  badgeClass = "green";
                }

                return (
                  <td key={columnIndex}>

                    {isLastColumn ? (
                      <span
                        className={`badge ${badgeClass}`}
                      >
                        {value}
                      </span>
                    ) : (
                      value
                    )}

                  </td>
                );
              })}

            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
}