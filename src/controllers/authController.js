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

module.exports = {
  register,
};
