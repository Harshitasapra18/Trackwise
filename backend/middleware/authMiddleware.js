const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verifies the JWT, then re-loads the user from the database so that
// deleted users lose access immediately and the role always comes from the
// database (never from a stale token).
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized. Please login first." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });

    const user = await User.findById(decoded.id).select("_id role").lean();

    if (!user) {
      return res.status(401).json({ message: "Account no longer exists." });
    }

    req.user = { id: String(user._id), role: user.role };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// Usage: router.post("/", protect, authorize("admin"), handler)
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied." });
  }
  next();
};

module.exports = protect;
module.exports.protect = protect;
module.exports.authorize = authorize;
