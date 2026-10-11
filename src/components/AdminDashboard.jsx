import "./AdminDashboard.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000/api";

// Small fetch wrapper: adds the token, throws Error(message) on failure
const callApi = async (path, { method = "GET", body } = {}) => {
  const token = localStorage.getItem("trackwiseToken");

  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Something went wrong");
    error.status = response.status;
    throw error;
  }

  return data;
};

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Mentors & Mentees" },
  { id: "students", label: "Student Assignment" },
  { id: "courses", label: "Courses & Subjects" },
];

function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [toast, setToast] = useState(null);

  const user = JSON.parse(localStorage.getItem("trackwiseUser") || "{}");

  const notify = useCallback((text, type = "ok") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("trackwiseToken");
    localStorage.removeItem("trackwiseUser");
    navigate("/login", { replace: true });
  }, [navigate]);

  // Shared handler: logs out on an expired token, otherwise shows the error
  const fail = useCallback(
    (error) => {
      if (error.status === 401) return logout();
      notify(error.message, "err");
    },
    [logout, notify]
  );

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <h2>◎ TrackWise</h2>
        <p className="admin-role">Admin Panel</p>

        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? "admin-nav active" : "admin-nav"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}

        <button className="admin-nav logout" onClick={logout}>
          Logout
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h1>{TABS.find((t) => t.id === tab).label}</h1>
          <span>Signed in as {user.fullName || "Admin"}</span>
        </header>

        {toast && <div className={`admin-toast ${toast.type}`}>{toast.text}</div>}

        {tab === "overview" && <Overview fail={fail} setTab={setTab} />}
        {tab === "users" && <UsersTab notify={notify} fail={fail} />}
        {tab === "students" && <StudentsTab notify={notify} fail={fail} />}
        {tab === "courses" && <CoursesTab notify={notify} fail={fail} />}
      </main>
    </div>
  );
}

// =====================================================================
// OVERVIEW
// =====================================================================
function Overview({ fail, setTab }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    callApi("/admin/stats").then((d) => setStats(d.stats)).catch(fail);
  }, [fail]);

  const cards = stats
    ? [
        ["Mentors", stats.mentors],
        ["Mentee Accounts", stats.mentees],
        ["Students", stats.students],
        ["Unassigned Students", stats.unassigned],
        ["Courses", stats.courses],
      ]
    : [];

  return (
    <>
      <div className="admin-cards">
        {cards.map(([label, value]) => (
          <div className="admin-card" key={label}>
            <h2>{value}</h2>
            <p>{label}</p>
          </div>
        ))}
      </div>

      <div className="admin-panel">
        <h3>How it works</h3>
        <ol className="admin-steps">
          <li>
            <b>Courses & Subjects</b> – create a course (e.g. CSE, 8 semesters) and add the subjects of every semester.
          </li>
          <li>
            <b>Mentors & Mentees</b> – create the mentor and mentee login accounts.
          </li>
          <li>
            <b>Student Assignment</b> – add students to a course and semester, then assign them to a mentor.
          </li>
          <li>
            Mentors only pick a subject from the list and enter <b>marks and attendance</b>.
          </li>
        </ol>

        {stats && stats.courses === 0 && (
          <button className="admin-btn" onClick={() => setTab("courses")}>
            Create your first course
          </button>
        )}
      </div>
    </>
  );
}

// =====================================================================
// USERS (mentor / mentee accounts)
// =====================================================================
const emptyUser = { fullName: "", username: "", email: "", password: "", role: "mentor" };

function UsersTab({ notify, fail }) {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState(emptyUser);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    callApi("/admin/users").then((d) => setUsers(d.users)).catch(fail);
  }, [fail]);

  useEffect(load, [load]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const d = await callApi("/admin/users", { method: "POST", body: form });
      notify(d.message);
      setForm({ ...emptyUser, role: form.role });
      load();
    } catch (error) {
      fail(error);
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async (u) => {
    const password = window.prompt(`New password for ${u.fullName} (min 6 characters):`);
    if (!password) return;
    try {
      const d = await callApi(`/admin/users/${u._id}/password`, { method: "PUT", body: { password } });
      notify(d.message);
    } catch (error) {
      fail(error);
    }
  };

  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.fullName}?`)) return;
    try {
      const d = await callApi(`/admin/users/${u._id}`, { method: "DELETE" });
      notify(d.message);
      load();
    } catch (error) {
      fail(error);
    }
  };

  const shown = users.filter((u) => filter === "all" || u.role === filter);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <div className="admin-panel">
        <h3>Add a mentor or mentee</h3>

        <form className="admin-form" onSubmit={submit}>
          <select value={form.role} onChange={set("role")}>
            <option value="mentor">Mentor</option>
            <option value="mentee">Mentee</option>
          </select>
          <input placeholder="Full name" value={form.fullName} onChange={set("fullName")} required />
          <input placeholder="Username" value={form.username} onChange={set("username")} required />
          <input type="email" placeholder="Email" value={form.email} onChange={set("email")} required />
          <input type="password" placeholder="Password (min 6)" value={form.password} onChange={set("password")} required />
          <button className="admin-btn" disabled={saving}>
            {saving ? "Adding..." : "Add"}
          </button>
        </form>
      </div>

      <div className="admin-panel">
        <div className="admin-row-between">
          <h3>Accounts ({shown.length})</h3>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="mentor">Mentors</option>
            <option value="mentee">Mentees</option>
          </select>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Mentees</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((u) => (
                <tr key={u._id}>
                  <td>{u.fullName}</td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td><span className={`pill ${u.role}`}>{u.role}</span></td>
                  <td>{u.role === "mentor" ? u.menteeCount : "-"}</td>
                  <td className="admin-actions">
                    <button onClick={() => resetPassword(u)}>Reset password</button>
                    <button className="danger" onClick={() => remove(u)}>Delete</button>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan="6" className="admin-empty">No accounts yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// =====================================================================
// STUDENTS + MENTOR ASSIGNMENT
// =====================================================================
const emptyStudent = {
  fullName: "", rollNumber: "", email: "", courseId: "", semester: "",
  mentorId: "", createLogin: false, username: "", password: "",
};

function StudentsTab({ notify, fail }) {
  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [mentees, setMentees] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(emptyStudent);
  const [selected, setSelected] = useState([]);
  const [bulkMentor, setBulkMentor] = useState("");
  const [filter, setFilter] = useState("all");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, u, c] = await Promise.all([
        callApi("/admin/students"),
        callApi("/admin/users"),
        callApi("/courses"),
      ]);
      setStudents(s.students);
      setMentors(u.users.filter((x) => x.role === "mentor"));
      setMentees(u.users.filter((x) => x.role === "mentee"));
      setCourses(c.courses);
    } catch (error) {
      fail(error);
    }
  }, [fail]);

  useEffect(() => {
    load();
  }, [load]);

  const course = courses.find((c) => c._id === form.courseId);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const body = {
        fullName: form.fullName,
        rollNumber: form.rollNumber,
        email: form.email,
        courseId: form.courseId,
        semester: form.semester,
        mentorId: form.mentorId || undefined,
        account: form.createLogin ? { username: form.username, password: form.password } : undefined,
      };
      const d = await callApi("/admin/students", { method: "POST", body });
      notify(d.message);
      setForm({ ...emptyStudent, courseId: form.courseId, semester: form.semester });
      load();
    } catch (error) {
      fail(error);
    } finally {
      setSaving(false);
    }
  };

  const assign = async (studentIds, mentorId) => {
    try {
      const d = await callApi("/admin/students/assign", { method: "PUT", body: { studentIds, mentorId: mentorId || null } });
      notify(d.message);
      setSelected([]);
      load();
    } catch (error) {
      fail(error);
    }
  };

  const link = async (studentId, userId) => {
    if (!userId) return;
    try {
      const d = await callApi(`/admin/students/${studentId}/link`, { method: "PUT", body: { userId } });
      notify(d.message);
      load();
    } catch (error) {
      fail(error);
    }
  };

  const changeSemester = async (s, semester) => {
    try {
      const d = await callApi(`/admin/students/${s._id}`, { method: "PUT", body: { semester } });
      notify(d.message);
      load();
    } catch (error) {
      fail(error);
    }
  };

  // For older students that have no course yet
  const setCourse = async (s, courseId) => {
    if (!courseId) return;
    try {
      const d = await callApi(`/admin/students/${s._id}`, { method: "PUT", body: { courseId, semester: s.semester } });
      notify(d.message);
      load();
    } catch (error) {
      fail(error);
    }
  };

  const remove = async (s) => {
    if (!window.confirm(`Delete ${s.fullName} and all their marks/attendance?`)) return;
    try {
      const d = await callApi(`/admin/students/${s._id}`, { method: "DELETE" });
      notify(d.message);
      load();
    } catch (error) {
      fail(error);
    }
  };

  const linkedIds = useMemo(
    () => new Set(students.filter((s) => s.user).map((s) => s.user._id)),
    [students]
  );
  const freeMentees = mentees.filter((m) => !linkedIds.has(m._id));

  const shown = students.filter((s) =>
    filter === "unassigned" ? !s.mentor : filter === "assigned" ? !!s.mentor : true
  );

  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <>
      <div className="admin-panel">
        <h3>Add a student</h3>
        {courses.length === 0 && (
          <p className="admin-hint">Create a course first (Courses & Subjects tab).</p>
        )}

        <form className="admin-form" onSubmit={submit}>
          <input placeholder="Full name" value={form.fullName} onChange={set("fullName")} required />
          <input placeholder="Roll number" value={form.rollNumber} onChange={set("rollNumber")} required />
          <input type="email" placeholder="Email" value={form.email} onChange={set("email")} required />

          <select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value, semester: "" })} required>
            <option value="">Course</option>
            {courses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>

          <select value={form.semester} onChange={set("semester")} required disabled={!course}>
            <option value="">Semester</option>
            {course && Array.from({ length: course.totalSemesters }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>Semester {n}</option>
            ))}
          </select>

          <select value={form.mentorId} onChange={set("mentorId")}>
            <option value="">Assign mentor later</option>
            {mentors.map((m) => <option key={m._id} value={m._id}>{m.fullName}</option>)}
          </select>

          <label className="admin-check">
            <input type="checkbox" checked={form.createLogin} onChange={(e) => setForm({ ...form, createLogin: e.target.checked })} />
            Also create mentee login
          </label>

          {form.createLogin && (
            <>
              <input placeholder="Login username" value={form.username} onChange={set("username")} required />
              <input type="password" placeholder="Login password (min 6)" value={form.password} onChange={set("password")} required />
            </>
          )}

          <button className="admin-btn" disabled={saving}>{saving ? "Adding..." : "Add student"}</button>
        </form>
      </div>

      <div className="admin-panel">
        <div className="admin-row-between">
          <h3>Students ({shown.length})</h3>

          <div className="admin-bulk">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="unassigned">Unassigned</option>
              <option value="assigned">Assigned</option>
            </select>

            <select value={bulkMentor} onChange={(e) => setBulkMentor(e.target.value)}>
              <option value="">Unassign</option>
              {mentors.map((m) => <option key={m._id} value={m._id}>{m.fullName}</option>)}
            </select>

            <button className="admin-btn" disabled={selected.length === 0} onClick={() => assign(selected, bulkMentor)}>
              {bulkMentor ? "Assign" : "Unassign"} selected ({selected.length})
            </button>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={shown.length > 0 && selected.length === shown.length}
                    onChange={(e) => setSelected(e.target.checked ? shown.map((s) => s._id) : [])}
                  />
                </th>
                <th>Student</th>
                <th>Course</th>
                <th>Sem</th>
                <th>Mentor</th>
                <th>Login</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((s) => (
                <tr key={s._id}>
                  <td><input type="checkbox" checked={selected.includes(s._id)} onChange={() => toggle(s._id)} /></td>
                  <td>
                    {s.fullName}
                    <small>{s.rollNumber}</small>
                  </td>
                  <td>
                    {s.course ? s.course.name : (
                      <select value="" onChange={(e) => setCourse(s, e.target.value)}>
                        <option value="">Set course…</option>
                        {courses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    )}
                  </td>
                  <td>
                    {s.course ? (
                      <select value={s.semester} onChange={(e) => changeSemester(s, e.target.value)}>
                        {Array.from({ length: s.course.totalSemesters }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    ) : s.semester}
                  </td>
                  <td>
                    <select value={s.mentor ? s.mentor._id : ""} onChange={(e) => assign([s._id], e.target.value)}>
                      <option value="">Unassigned</option>
                      {mentors.map((m) => <option key={m._id} value={m._id}>{m.fullName}</option>)}
                    </select>
                  </td>
                  <td>
                    {s.user ? (
                      <span className="pill mentee">{s.user.username}</span>
                    ) : (
                      <select value="" onChange={(e) => link(s._id, e.target.value)}>
                        <option value="">Link account…</option>
                        {freeMentees.map((m) => <option key={m._id} value={m._id}>{m.fullName} ({m.username})</option>)}
                      </select>
                    )}
                  </td>
                  <td className="admin-actions">
                    <button className="danger" onClick={() => remove(s)}>Delete</button>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan="7" className="admin-empty">No students to show</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// =====================================================================
// COURSES, SEMESTERS & SUBJECTS
// =====================================================================
const emptySubject = { name: "", code: "", credits: 4, internalMax: 30, externalMax: 70 };

function CoursesTab({ notify, fail }) {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [semester, setSemester] = useState(1);
  const [subjects, setSubjects] = useState([]);

  const [courseForm, setCourseForm] = useState({ name: "", code: "", totalSemesters: 8 });
  const [subjectForm, setSubjectForm] = useState(emptySubject);
  const [bulkText, setBulkText] = useState("");
  const [editing, setEditing] = useState(null);

  const course = courses.find((c) => c._id === courseId);

  const loadCourses = useCallback(
    async (keep) => {
      try {
        const d = await callApi("/courses");
        setCourses(d.courses);
        setCourseId((prev) => keep || (d.courses.some((c) => c._id === prev) ? prev : d.courses[0]?._id || ""));
      } catch (error) {
        fail(error);
      }
    },
    [fail]
  );

  const loadSubjects = useCallback(async () => {
    if (!courseId) return setSubjects([]);
    try {
      const d = await callApi(`/courses/${courseId}/subjects`);
      setSubjects(d.subjects);
    } catch (error) {
      fail(error);
    }
  }, [courseId, fail]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const createCourse = async (e) => {
    e.preventDefault();
    try {
      const d = await callApi("/courses", { method: "POST", body: courseForm });
      notify(d.message);
      setCourseForm({ name: "", code: "", totalSemesters: 8 });
      setSemester(1);
      loadCourses(d.course._id);
    } catch (error) {
      fail(error);
    }
  };

  const deleteCourse = async () => {
    if (!window.confirm(`Delete course ${course.name} and all its subjects?`)) return;
    try {
      const d = await callApi(`/courses/${courseId}`, { method: "DELETE" });
      notify(d.message);
      setCourseId("");
      loadCourses();
    } catch (error) {
      fail(error);
    }
  };

  const addSubject = async (e) => {
    e.preventDefault();
    try {
      const d = await callApi(`/courses/${courseId}/subjects`, { method: "POST", body: { ...subjectForm, semester } });
      notify(d.message);
      setSubjectForm(emptySubject);
      loadSubjects();
      loadCourses(courseId);
    } catch (error) {
      fail(error);
    }
  };

  // One subject per line:  CODE, Subject name   (default 30 internal / 70 external)
  const addBulk = async () => {
    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    const items = lines.map((line) => {
      const [code, ...rest] = line.split(",");
      return { code: (code || "").trim(), name: rest.join(",").trim() };
    });

    if (items.length === 0) return;

    try {
      const d = await callApi(`/courses/${courseId}/subjects`, { method: "POST", body: { semester, subjects: items } });
      notify(d.skipped?.length ? `${d.message}. Skipped: ${d.skipped.map((s) => s.name).join(", ")}` : d.message);
      setBulkText("");
      loadSubjects();
      loadCourses(courseId);
    } catch (error) {
      fail(error);
    }
  };

  const saveEdit = async () => {
    try {
      const d = await callApi(`/courses/subjects/${editing._id}`, { method: "PUT", body: editing });
      notify(d.message);
      setEditing(null);
      loadSubjects();
    } catch (error) {
      fail(error);
    }
  };

  const deleteSubject = async (s) => {
    if (!window.confirm(`Delete ${s.name}?`)) return;
    try {
      const d = await callApi(`/courses/subjects/${s._id}`, { method: "DELETE" });
      notify(d.message);
      loadSubjects();
      loadCourses(courseId);
    } catch (error) {
      fail(error);
    }
  };

  const semesterSubjects = subjects.filter((s) => s.semester === semester);
  const setC = (k) => (e) => setCourseForm({ ...courseForm, [k]: e.target.value });
  const setS = (k) => (e) => setSubjectForm({ ...subjectForm, [k]: e.target.value });

  return (
    <>
      <div className="admin-panel">
        <h3>Create a course</h3>
        <form className="admin-form" onSubmit={createCourse}>
          <input placeholder="Course name (e.g. CSE)" value={courseForm.name} onChange={setC("name")} required />
          <input placeholder="Code (optional)" value={courseForm.code} onChange={setC("code")} />
          <input type="number" min="1" max="12" value={courseForm.totalSemesters} onChange={setC("totalSemesters")} title="Number of semesters" required />
          <button className="admin-btn">Create course</button>
        </form>
      </div>

      {courses.length > 0 && (
        <div className="admin-panel">
          <div className="admin-row-between">
            <div className="admin-bulk">
              <h3 style={{ margin: 0 }}>Course</h3>
              <select value={courseId} onChange={(e) => { setCourseId(e.target.value); setSemester(1); }}>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>{c.name} ({c.subjectCount} subjects)</option>
                ))}
              </select>
            </div>
            <button className="admin-btn danger-btn" onClick={deleteCourse}>Delete course</button>
          </div>

          {course && (
            <>
              <div className="admin-semesters">
                {Array.from({ length: course.totalSemesters }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    className={n === semester ? "sem active" : "sem"}
                    onClick={() => { setSemester(n); setEditing(null); }}
                  >
                    Sem {n}
                    <small>{subjects.filter((s) => s.semester === n).length}</small>
                  </button>
                ))}
              </div>

              <h4>{course.name} – Semester {semester} subjects</h4>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Subject</th>
                      <th>Credits</th>
                      <th>Internal max</th>
                      <th>External max</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {semesterSubjects.map((s) =>
                      editing && editing._id === s._id ? (
                        <tr key={s._id}>
                          <td><input value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} /></td>
                          <td><input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></td>
                          <td><input type="number" value={editing.credits} onChange={(e) => setEditing({ ...editing, credits: e.target.value })} /></td>
                          <td><input type="number" value={editing.internalMax} onChange={(e) => setEditing({ ...editing, internalMax: e.target.value })} /></td>
                          <td><input type="number" value={editing.externalMax} onChange={(e) => setEditing({ ...editing, externalMax: e.target.value })} /></td>
                          <td className="admin-actions">
                            <button onClick={saveEdit}>Save</button>
                            <button onClick={() => setEditing(null)}>Cancel</button>
                          </td>
                        </tr>
                      ) : (
                        <tr key={s._id}>
                          <td>{s.code}</td>
                          <td>{s.name}</td>
                          <td>{s.credits}</td>
                          <td>{s.internalMax}</td>
                          <td>{s.externalMax}</td>
                          <td className="admin-actions">
                            <button onClick={() => setEditing({ ...s })}>Edit</button>
                            <button className="danger" onClick={() => deleteSubject(s)}>Delete</button>
                          </td>
                        </tr>
                      )
                    )}
                    {semesterSubjects.length === 0 && (
                      <tr><td colSpan="6" className="admin-empty">No subjects in this semester yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <h4>Add one subject</h4>
              <form className="admin-form" onSubmit={addSubject}>
                <input placeholder="Code (e.g. CS301)" value={subjectForm.code} onChange={setS("code")} required />
                <input placeholder="Subject name" value={subjectForm.name} onChange={setS("name")} required />
                <input type="number" min="0" placeholder="Credits" value={subjectForm.credits} onChange={setS("credits")} title="Credits" />
                <input type="number" min="1" placeholder="Internal max" value={subjectForm.internalMax} onChange={setS("internalMax")} title="Internal max marks" />
                <input type="number" min="1" placeholder="External max" value={subjectForm.externalMax} onChange={setS("externalMax")} title="External max marks" />
                <button className="admin-btn">Add subject</button>
              </form>

              <h4>…or add many at once</h4>
              <p className="admin-hint">One per line as <code>CODE, Subject name</code> (30 internal / 70 external by default; edit later if needed).</p>
              <textarea
                rows="4"
                placeholder={"CS301, Data Structures\nCS302, Operating Systems\nCS303, DBMS"}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
              />
              <button className="admin-btn" onClick={addBulk} disabled={!bulkText.trim()}>
                Add to semester {semester}
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

export default AdminDashboard;
