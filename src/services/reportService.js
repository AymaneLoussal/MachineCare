const mongoose = require("mongoose");
const Machine = require("../models/machine");
const Report = require("../models/report");

const reportStatuses = ["ouvert", "en_cours", "résolu"];

const createReport = async ({ machineId, description, userId }) => {
  if (!mongoose.isObjectIdOrHexString(machineId)) {
    const error = new Error("Invalid machine ID");
    error.status = 400;
    throw error;
  }

  const machine = await Machine.findById(machineId);
  if (!machine) {
    const error = new Error("Machine not found");
    error.status = 404;
    throw error;
  }

  return Report.create({
    machine: machine._id,
    description: description.trim(),
    reportedBy: userId,
    status: "ouvert",
    resolvedAt: null,
  });
};

const getReports = async (filters = {}) => {
  const query = {};
  if (filters.machine !== undefined) {
    if (!mongoose.isObjectIdOrHexString(filters.machine)) {
      const error = new Error("Invalid machine ID filter");
      error.status = 400;
      throw error;
    }
    query.machine = filters.machine;
  }
  if (filters.status !== undefined) {
    if (!reportStatuses.includes(filters.status)) {
      const error = new Error("Invalid status filter");
      error.status = 400;
      throw error;
    }
    query.status = filters.status;
  }
  return Report.find(query);
};

const getReportById = async (id) => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    const error = new Error("Invalid report ID");
    error.status = 400;
    throw error;
  }
  return Report.findById(id);
};

const updateReport = async (id, updates) => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    const error = new Error("Invalid report ID");
    error.status = 400;
    throw error;
  }
  const report = await Report.findById(id);
  if (!report) return null;

  const nextStatus = updates.status === undefined ? report.status : updates.status;
  if (!reportStatuses.includes(nextStatus)) {
    const error = new Error("Invalid status");
    error.status = 400;
    throw error;
  }

  if (nextStatus === "résolu") {
    if (typeof updates.resolutionNote !== "string" || updates.resolutionNote.trim() === "") {
      const error = new Error("resolutionNote is required when resolving a report");
      error.status = 400;
      throw error;
    }
    report.resolutionNote = updates.resolutionNote.trim();
    if (report.status !== "résolu") report.resolvedAt = new Date();
  } else {
    if (updates.resolutionNote !== undefined) {
      report.resolutionNote = updates.resolutionNote.trim();
    }
    report.resolvedAt = null;
  }

  report.status = nextStatus;
  await report.save();
  return report;
};

module.exports = { createReport, getReports, getReportById, updateReport };
