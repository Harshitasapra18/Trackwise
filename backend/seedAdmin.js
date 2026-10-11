// Creates the first admin account (there is no public admin signup).
//   npm run seed:admin
// Optional env vars in .env: ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_EMAIL, ADMIN_NAME
require("dotenv").config();

const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("./models/User");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const username = process.env.ADMIN_USERNAME || "admin";
    const password = process.env.ADMIN_PASSWORD || "Admin@123";
    const email = (process.env.ADMIN_EMAIL || "admin@trackwise.local").toLowerCase();
    const fullName = process.env.ADMIN_NAME || "System Admin";

    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      console.log(`User "${existing.username}" already exists (role: ${existing.role}). Nothing changed.`);
      return;
    }

    await User.create({
      fullName,
      username,
      email,
      password: await bcrypt.hash(password, 10),
      role: "admin",
    });

    console.log(`Admin created -> username: ${username}`);
    if (!process.env.ADMIN_PASSWORD) {
      console.log("Default password is Admin@123 - change it via ADMIN_PASSWORD in .env before sharing the app.");
    }
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
