const express = require("express");
const authRoutes = require("./routes/authRoutes");
const machineRoutes = require("./routes/machineRoutes");
const userRoutes = require("./routes/userRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    message: "API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/machines", machineRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);

module.exports = app;
