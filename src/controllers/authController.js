const authService = require("../services/authService");

const register = async (req, res) => {
  console.log("REGISTER ROUTE REACHED");
  console.log("BODY:", req.body);

  try {
    const { name, email, password } = req.body;

    console.log("BEFORE SERVICE");

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const user = await authService.register(name, email, password);

    console.log("AFTER SERVICE");

    return res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    if (error.message === "Email already exists") {
      return res.status(409).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const result = await authService.login(email, password);

    return res.status(200).json({
      message: "Login successful",
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    if (error.message === "Invalid email or password") {
      return res.status(401).json({
        message: error.message,
      });
    }

    console.error("LOGIN ERROR:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
module.exports = {
  register,
  login,
};
