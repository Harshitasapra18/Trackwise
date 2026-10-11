import "./RegisterPage.css";
import { Link } from "react-router-dom";
import { useState } from "react";
import loginImage from "../assets/login-image.png";

function RegisterPage() {
  const [role, setRole] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Check role
    if (!role) {
      alert("Please select a role");
      return;
    }

    // Check fields
    if (
      !fullName ||
      !username ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      alert("Please fill all fields");
      return;
    }

    // Check password
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      // Send data to backend
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName,
            username,
            email,
            password,
            role,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Registration Successful!");

        // Clear form
        setFullName("");
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setRole("");
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
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
          Join TrackWise to connect mentors and mentees,
          monitor academic progress, attendance, and performance.
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

        <div className="register-card">
          <h2>Create Account</h2>

          <p>
            Fill in your details to create your TrackWise account.
          </p>

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
                checked={role === "mentee"}
                onChange={() => setRole("mentee")}
              />
              Mentee
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
                checked={role === "mentor"}
                onChange={() => setRole("mentor")}
              />
              Mentor
            </label>
          </div>

          <label>Full Name</label>

          <div className="input-box">
            <span>👤</span>

            <input
              type="text"
              placeholder="Enter Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <label>Username</label>

          <div className="input-box">
            <span>👤</span>

            <input
              type="text"
              placeholder="Enter Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <label>Email</label>

          <div className="input-box">
            <span>📧</span>

            <input
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <label>Password</label>

          <div className="input-box">
            <span>🔒</span>

            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <label>Confirm Password</label>

          <div className="input-box">
            <span>🔒</span>

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
            />
          </div>

          <button
            className="register-btn"
            onClick={handleRegister}
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Create Account →"}
          </button>

          <div className="signup">
            Already have an account?{" "}
            <Link to="/login">Sign In</Link>
          </div>

          <hr />

          <div className="security">
            <span>🛡️</span>
            Your information is protected with
            256-bit encryption.
          </div>
        </div>

        <div className="footer">
          TRACKWISE © 2026 ALL RIGHTS RESERVED
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;