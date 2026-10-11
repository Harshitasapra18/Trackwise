const mongoose = require("mongoose");

// Removes MongoDB operators ($ne, $gt, ...) and dotted keys from request input
// so values like {"username": {"$ne": null}} can never reach a query.
const clean = (value) => {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value)) {
      if (key.startsWith("$") || key.includes(".")) continue;
      out[key] = clean(value[key]);
    }
    return out;
  }
  return value;
};

const sanitizeInput = (req, res, next) => {
  if (req.body) req.body = clean(req.body);
  next();
};

// Any :param ending in "Id" or named "id" must be a valid ObjectId
const validateIds = (req, res, next) => {
  for (const [key, value] of Object.entries(req.params)) {
    if ((key === "id" || key.endsWith("Id")) && !mongoose.isValidObjectId(value)) {
      return res.status(400).json({ message: "Invalid id" });
    }
  }
  next();
};

// Use on routers: router.param(...) is awkward in Express 5, so apply per route group
const idParams = (router, names) => {
  names.forEach((name) =>
    router.param(name, (req, res, next, value) => {
      if (!mongoose.isValidObjectId(value)) {
        return res.status(400).json({ message: "Invalid id" });
      }
      next();
    })
  );
};

// Ensures a value is a string (blocks objects/arrays smuggled into fields)
const str = (v) => (typeof v === "string" ? v.trim() : "");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Password rule used everywhere accounts are created
const passwordProblem = (password) => {
  if (typeof password !== "string" || password.length < 8) {
    return "Password must be at least 8 characters";
  }
  if (password.length > 72) {
    return "Password must be at most 72 characters";
  }
  return null;
};

module.exports = { sanitizeInput, validateIds, idParams, str, escapeRegex, passwordProblem };
