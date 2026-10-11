import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem("trackwiseToken");
  const userData = localStorage.getItem("trackwiseUser");

  // User is not logged in
  if (!token || !userData) {
    return <Navigate to="/login" replace />;
  }

  // Get logged-in user
  const user = JSON.parse(userData);

  // Check role
  if (allowedRole && user.role !== allowedRole) {
    if (user.role === "admin") {
      return <Navigate to="/admin-dashboard" replace />;
    }

    if (user.role === "mentor") {
      return <Navigate to="/mentor-dashboard" replace />;
    }

    if (user.role === "mentee") {
      return <Navigate to="/mentee-dashboard" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;