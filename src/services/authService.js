const bcrypt = require("bcryptjs");

const User = require("../models/user");

const register = async (name, email, password) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
  };
};

const login = async (email, password) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error("Invalid email or password");
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
  };
};

module.exports = {
  register,
  login,
};
