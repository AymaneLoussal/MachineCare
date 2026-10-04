const reportService = require("../services/reportService");
const reportStatuses = ["ouvert", "en_cours", "résolu"];

const handleError = (res, error) => {
  if (error.status === 400 || error.status === 404) {
    return res.status(error.status).json({ message: error.message });
  }
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: "Invalid report data" });
  }
  console.error("REPORT ERROR:", error);
  return res.status(500).json({ message: "Internal server error" });
};

const createReport = async (req, res) => {
  const body = req.body || {};
  if (typeof body.machineId !== "string" || body.machineId.trim() === "") {
    return res.status(400).json({ message: "machineId is required" });
  }
  if (typeof body.description !== "string" || body.description.trim() === "") {
    return res.status(400).json({ message: "description is required" });
  }
  try {
    const report = await reportService.createReport({
      machineId: body.machineId,
      description: body.description,
      userId: req.userId,
    });
    return res.status(201).json({ report });
  } catch (error) {
    return handleError(res, error);
  }
};

const getReports = async (req, res) => {
  const { machine, status } = req.query;
  if (machine !== undefined && typeof machine !== "string") {
    return res.status(400).json({ message: "machine must be a single value" });
  }
  if (status !== undefined && typeof status !== "string") {
    return res.status(400).json({ message: "status must be a single value" });
  }
  if (status !== undefined && !reportStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status filter" });
  }
  try {
    const reports = await reportService.getReports({ machine, status });
    return res.status(200).json({ reports });
  } catch (error) {
    return handleError(res, error);
  }
};

const getReportById = async (req, res) => {
  try {
    const report = await reportService.getReportById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });
    return res.status(200).json({ report });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateReport = async (req, res) => {
  const body = req.body || {};
  const updates = {};
  if (Object.prototype.hasOwnProperty.call(body, "status")) {
    if (typeof body.status !== "string" || !reportStatuses.includes(body.status)) {
      return res.status(400).json({
        message: "status must be one of: " + reportStatuses.join(", "),
      });
    }
    updates.status = body.status;
  }
  if (Object.prototype.hasOwnProperty.call(body, "resolutionNote")) {
    if (typeof body.resolutionNote !== "string") {
      return res.status(400).json({ message: "resolutionNote must be a string" });
    }
    updates.resolutionNote = body.resolutionNote;
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "Provide status or resolutionNote to update" });
  }
  try {
    const report = await reportService.updateReport(req.params.id, updates);
    if (!report) return res.status(404).json({ message: "Report not found" });
    return res.status(200).json({ report });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = { createReport, getReports, getReportById, updateReport };
