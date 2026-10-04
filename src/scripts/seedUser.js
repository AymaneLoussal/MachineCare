require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/user");
const connectDatabase = require("../config/database");

const seedUser = async () => {
  const name = process.env.SEED_USER_NAME;
  const email = process.env.SEED_USER_EMAIL;
  const password = process.env.SEED_USER_PASSWORD;

  if (!name || !name.trim() || !email || !email.trim() || !password || !password.trim()) {
    throw new Error("SEED_USER_NAME, SEED_USER_EMAIL and SEED_USER_PASSWORD are required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    await connectDatabase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      console.log("Seed user already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });
    console.log("Seed user created");
  } catch (error) {
    if (error.code === 11000) {
      console.log("Seed user already exists");
      return;
    }
    throw error;
  } finally {
    await mongoose.disconnect();
  }
};

seedUser().catch((error) => {
  console.error("Failed to seed user:", error.message);
  process.exitCode = 1;
});
