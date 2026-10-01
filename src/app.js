const express = require("express");
const authRoutes = require("./routes/authRoutes");
const machineRoutes = require("./routes/machineRoutes");

const app = express();

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    message: "API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/machines", machineRoutes);

module.exports = app;
