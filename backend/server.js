require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./db");
const { sanitizeInput } = require("./middleware/security");

// ---------- Refuse to start with unsafe configuration ----------
if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is missing in .env");
  process.exit(1);
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error("JWT_SECRET is missing or too short (use at least 16 random characters).");
  console.error('Generate one: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
  process.exit(1);
}

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

// ---------- Security headers ----------
app.use(helmet());

// ---------- CORS: only the TrackWise frontend may call this API ----------
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

const isDev = process.env.NODE_ENV !== "production";

app.use(
  cors({
    origin: (origin, callback) => {
      // no origin = curl/Postman/server-to-server
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      // any local dev port (Vite switches to 5174 etc. when 5173 is busy)
      if (isDev && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
  })
);

// ---------- Body parsing + NoSQL-injection protection ----------
app.use(express.json({ limit: "100kb" }));
app.use(sanitizeInput);

// ---------- General rate limit for the whole API ----------
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests. Please slow down." },
  })
);

// ---------- Routes ----------
app.use("/api/auth", require("./routes/auth"));
app.use("/api/students", require("./routes/students"));
app.use("/api/meetings", require("./routes/meetings"));
app.use("/api/alerts", require("./routes/alerts"));
app.use("/api/marks", require("./routes/marks"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/courses", require("./routes/courses"));

app.get("/", (req, res) => {
  res.json({ message: "TrackWise Backend is running!" });
});

// ---------- 404 + error handling ----------
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "Origin not allowed" });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request too large" });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Server error" });
});

// ---------- Start only after the database is connected ----------
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
