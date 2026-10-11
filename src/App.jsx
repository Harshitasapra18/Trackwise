import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./components/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";

import MentorDashboard from "./components/MentorDashboard";
import MenteeDashboard from "./components/MenteeDashboard";
import MyMentees from "./components/MyMentees";
import StudentProfile from "./components/StudentProfile";
import MeetingDashboard from "./components/MeetingDashboard";
import AtRiskStudents from "./components/AtRiskStudents";
import BulkAlerts from "./components/BulkAlerts";
import Reports from "./components/Reports";
import MentorProfile from "./components/MentorProfile";
import AdminDashboard from "./components/AdminDashboard";

import {
  Marks,
  Attendance,
  CGPATracker,
  AcademicTarget,
  BatchComparison,
  Alerts,
  MenteeProfile,
} from "./components/MenteePages";

function App() {
  return (
    <Routes>

      {/* =========================
          DEFAULT ROUTE
      ========================= */}

      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      {/* =========================
          PUBLIC ROUTES
      ========================= */}

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/register"
        element={<Navigate to="/login" replace />}
      />


      {/* =========================
          ADMIN DASHBOARD
      ========================= */}

      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />


      {/* =========================
          MENTOR DASHBOARD
      ========================= */}

      <Route
        path="/mentor-dashboard"
        element={
          <ProtectedRoute allowedRole="mentor">
            <MentorDashboard />
          </ProtectedRoute>
        }
      />


      {/* =========================
          MENTEE DASHBOARD
      ========================= */}

      <Route
        path="/mentee-dashboard"
        element={
          <ProtectedRoute allowedRole="mentee">
            <MenteeDashboard />
          </ProtectedRoute>
        }
      />


      {/* =========================
          MENTOR PAGES
      ========================= */}

      <Route
        path="/my-mentees"
        element={
          <ProtectedRoute allowedRole="mentor">
            <MyMentees />
          </ProtectedRoute>
        }
      />

      {/* IMPORTANT:
          Student ID is required in URL
      */}

      <Route
        path="/student-profile/:studentId"
        element={
          <ProtectedRoute allowedRole="mentor">
            <StudentProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/meetings"
        element={
          <ProtectedRoute allowedRole="mentor">
            <MeetingDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/at-risk"
        element={
          <ProtectedRoute allowedRole="mentor">
            <AtRiskStudents />
          </ProtectedRoute>
        }
      />

      <Route
        path="/bulk-alerts"
        element={
          <ProtectedRoute allowedRole="mentor">
            <BulkAlerts />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRole="mentor">
            <Reports />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRole="mentor">
            <MentorProfile />
          </ProtectedRoute>
        }
      />


      {/* =========================
          MENTEE PAGES
      ========================= */}

      <Route
        path="/marks"
        element={
          <ProtectedRoute allowedRole="mentee">
            <Marks />
          </ProtectedRoute>
        }
      />

      <Route
        path="/attendance"
        element={
          <ProtectedRoute allowedRole="mentee">
            <Attendance />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cgpa-tracker"
        element={
          <ProtectedRoute allowedRole="mentee">
            <CGPATracker />
          </ProtectedRoute>
        }
      />

      <Route
        path="/academic-target"
        element={
          <ProtectedRoute allowedRole="mentee">
            <AcademicTarget />
          </ProtectedRoute>
        }
      />

      <Route
        path="/batch-comparison"
        element={
          <ProtectedRoute allowedRole="mentee">
            <BatchComparison />
          </ProtectedRoute>
        }
      />

      <Route
        path="/alerts"
        element={
          <ProtectedRoute allowedRole="mentee">
            <Alerts />
          </ProtectedRoute>
        }
      />

      <Route
        path="/mentee-profile"
        element={
          <ProtectedRoute allowedRole="mentee">
            <MenteeProfile />
          </ProtectedRoute>
        }
      />


      {/* =========================
          INVALID ROUTE
      ========================= */}

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />

    </Routes>
  );
}

export default App;