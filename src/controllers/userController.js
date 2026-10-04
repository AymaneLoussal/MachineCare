const userService = require("../services/userService");

const createUser = async (req, res) => {
  const body = req.body || {};
  const requiredFields = ["name", "email", "password"];
  const missingField = requiredFields.find(
    (field) => typeof body[field] !== "string" || body[field].trim() === "",
  );

  if (missingField) {
    return res.status(400).json({
      message: missingField + " is required",
    });
  }

  const email = body.email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Email is invalid" });
  }

  try {
    const user = await userService.createUser(
      body.name,
      email,
      body.password,
    );
    return res.status(201).json(user);
  } catch (error) {
    if (error.message === "Email already exists" || error.code === 11000) {
      return res.status(409).json({ message: "Email already exists" });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    console.error("CREATE USER ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await userService.getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateProfile = async (req, res) => {
  const body = req.body || {};
  const updates = {};

  if (Object.prototype.hasOwnProperty.call(body, "name")) {
    updates.name = body.name;
  }

  if (Object.prototype.hasOwnProperty.call(body, "email")) {
    updates.email = body.email;
  }

  if (Object.prototype.hasOwnProperty.call(body, "password")) {
    updates.password = body.password;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      message: "Provide at least one of name, email or password to update",
    });
  }

  try {
    const user = await userService.updateUserProfile(req.userId, updates);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    if (error.message === "Email already exists") {
      return res.status(409).json({ message: "Email already exists" });
    }

    if (error.message.includes("must be")) {
      return res.status(400).json({ message: error.message });
    }

    console.error("UPDATE PROFILE ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createUser,
  getProfile,
  updateProfile,
};
