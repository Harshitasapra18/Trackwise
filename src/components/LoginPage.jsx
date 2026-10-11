import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import loginImage from "../assets/login-image.png";
import { useState } from "react";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async () => {
    // Check role
    if (!role) {
      alert("Please select a role");
      return;
    }

    // Check username
    if (!username.trim()) {
      alert("Please enter username");
      return;
    }

    // Check password
    if (!password.trim()) {
      alert("Please enter password");
      return;
    }

    try {
      setLoading(true);

      // Send login request to backend
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            password,
            role,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Login failed");
        return;
      }

      // =========================
      // SAVE JWT TOKEN
      // =========================
      localStorage.setItem(
        "trackwiseToken",
        data.token
      );

      // Save logged-in user
      localStorage.setItem(
        "trackwiseUser",
        JSON.stringify(data.user)
      );

      // Navigate according to actual user role
      if (data.user.role === "admin") {
        navigate("/admin-dashboard");
      } else if (data.user.role === "mentor") {
        navigate("/mentor-dashboard");
      } else if (data.user.role === "mentee") {
        navigate("/mentee-dashboard");
      }

    } catch (error) {
      console.error("Login error:", error);

      alert(
        "Unable to connect to server. Please make sure backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {/* Left Section */}
      <div className="left-section">
        <img
          src={loginImage}
          alt="Mentorship"
          className="hero-image"
        />

        <h2>"Your Academic Journey, Guided"</h2>

        <p>
          A dedicated space for mentors and students to track attendance,
          marks, and academic progress together.
        </p>
      </div>

      {/* Right Section */}
      <div className="right-section">
        <div className="logo-container">
          <div className="logo-circle">◎</div>
          <h2>TrackWise</h2>
        </div>

        <p className="subtitle">
          Empower growth through guided mentorship.
        </p>

        <div className="login-card">
          <h2>Sign in to TrackWise</h2>

          <p>Enter your username and password to continue.</p>

          <span className="role-label">
            SELECT YOUR ROLE
          </span>

          <div className="role-selection">
            <label
              className={
                role === "mentee"
                  ? "role-option active"
                  : "role-option"
              }
            >
              <input
                type="radio"
                name="role"
                checked={role === "mentee"}
                onChange={() => setRole("mentee")}
              />
              Mentee
            </label>

            <label
              className={
                role === "admin"
                  ? "role-option active"
                  : "role-option"
              }
            >
              <input
                type="radio"
                name="role"
                checked={role === "admin"}
                onChange={() => setRole("admin")}
              />
              Admin
            </label>

            <label
              className={
                role === "mentor"
                  ? "role-option active"
                  : "role-option"
              }
            >
              <input
                type="radio"
                name="role"
                checked={role === "mentor"}
                onChange={() => setRole("mentor")}
              />
              Mentor
            </label>
          </div>

          <label>Username</label>

          <div className="input-box">
            <span>👤</span>

            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <label>Password</label>

          <div className="input-box">
            <span>🔒</span>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <span>👁️</span>
          </div>

          <div className="options">
            <span></span>

            <span style={{ fontSize: "13px", color: "#6b7280" }}>Forgot password? Ask your admin to reset it.</span>
          </div>

          <button
            className="signin-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In "}
            {!loading && <span>→</span>}
          </button>

          <div className="signup">
            Accounts are created by your admin.
          </div>

          <hr />

          <div className="security">
            <span>🛡️</span>
            Sessions are protected with signed, expiring tokens.
          </div>
        </div>

        <div className="footer">
          TRACKWISE © 2026 ALL RIGHTS RESERVED
        </div>
      </div>
    </div>
  );
}

export default LoginPage;