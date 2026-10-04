const bcrypt = require("bcryptjs");
const User = require("../models/user");

const createUser = async (name, email, password) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
  };
};

const getUserById = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) return null;
  return {
    id: user._id,
    name: user.name,
    email: user.email,
  };
};

const updateUserProfile = async (userId, updates) => {
  const user = await User.findById(userId);
  if (!user) {
    return null;
  }

  if (updates.name !== undefined) {
    if (typeof updates.name !== "string" || updates.name.trim() === "") {
      throw new Error("name must be a non-empty string");
    }
    user.name = updates.name.trim();
  }

  if (updates.email !== undefined) {
    if (typeof updates.email !== "string" || updates.email.trim() === "") {
      throw new Error("email must be a non-empty string");
    }
    const normalizedEmail = updates.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error("Email is invalid");
    }
    const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: userId } });
    if (existingUser) {
      throw new Error("Email already exists");
    }
    user.email = normalizedEmail;
  }

  if (updates.password !== undefined) {
    if (typeof updates.password !== "string" || updates.password.trim() === "") {
      throw new Error("password must be a non-empty string");
    }
    user.password = await bcrypt.hash(updates.password, 10);
  }

  await user.save();

  return {
    id: user._id,
    name: user.name,
    email: user.email,
  };
};

module.exports = {
  createUser,
  getUserById,
  updateUserProfile,
};
