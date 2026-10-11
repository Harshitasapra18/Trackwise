const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const { str, escapeRegex, passwordProblem } = require("../middleware/security");

const router = express.Router();

// A real bcrypt hash, compared against when the username does not exist so
// response time does not reveal which usernames are valid.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

// Brute-force protection: failed logins are limited per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again in 15 minutes." },
});

// =========================
// REGISTER (disabled by default - the admin creates accounts)
// Set ALLOW_PUBLIC_REGISTER=true in .env to turn it back on.
// =========================
router.post("/register", loginLimiter, async (req, res) => {
  try {
    if (process.env.ALLOW_PUBLIC_REGISTER !== "true") {
      return res.status(403).json({
        message: "Registration is closed. Please ask the admin to create your account.",
      });
    }

    const fullName = str(req.body?.fullName);
    const username = str(req.body?.username);
    const email = str(req.body?.email).toLowerCase();
    const password = req.body?.password;
    const role = str(req.body?.role);

    if (!fullName || !username || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!["mentor", "mentee"].includes(role)) {
      return res.status(400).json({ message: "Role must be mentor or mentee" });
    }

    const problem = passwordProblem(password);
    if (problem) return res.status(400).json({ message: problem });

    if (await User.findOne({ username: new RegExp(`^${escapeRegex(username)}$`, "i") })) {
      return res.status(400).json({ message: "Username already exists" });
    }

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const user = await User.create({
      fullName,
      username,
      email,
      password: await bcrypt.hash(password, 10),
      role,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user._id, fullName: user.fullName, username: user.username, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// LOGIN
// =========================
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const username = str(req.body?.username);
    const password = req.body?.password;
    const role = str(req.body?.role);

    if (!username || typeof password !== "string" || !password || !role) {
      return res.status(400).json({ message: "Username, password and role are required" });
    }

    // Usernames are matched case-insensitively ("Admin" and "admin" are the same)
    const user = await User.findOne({
      username: new RegExp(`^${escapeRegex(username)}$`, "i"),
    });

    const passwordMatch = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);

    // One generic message for every failure so nothing is revealed about
    // which usernames exist or which role they have.
    if (!user || !passwordMatch || user.role !== role) {
      return res.status(401).json({ message: "Invalid username, password or role" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: "1d",
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user._id, fullName: user.fullName, username: user.username, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
