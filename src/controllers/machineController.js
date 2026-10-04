const machineService = require("../services/machineService");

const statuses = ["disponible", "maintenance", "hors_service"];

const handleError = (res, error) => {
  if (error.code === 11000) {
    return res.status(409).json({ message: "Machine reference already exists" });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }

  if (error.name === "CastError") {
    return res.status(400).json({ message: "Invalid machine ID" });
  }

  console.error("MACHINE ERROR:", error);
  return res.status(500).json({ message: "Internal server error" });
};

const createMachine = async (req, res) => {
  const body = req.body || {};
  const requiredFields = ["reference", "name", "workshop", "status"];
  const missingField = requiredFields.find(
    (field) => typeof body[field] !== "string" || body[field].trim() === "",
  );

  if (missingField) {
    return res.status(400).json({
      message: missingField + " is required",
    });
  }

  if (!statuses.includes(body.status)) {
    return res.status(400).json({
      message: "status must be one of: " + statuses.join(", "),
    });
  }

  try {
    const machine = await machineService.createMachine({
      reference: body.reference,
      name: body.name,
      workshop: body.workshop,
      status: body.status,
    });
    return res.status(201).json({ machine });
  } catch (error) {
    return handleError(res, error);
  }
};

const getMachines = async (req, res) => {
  const { workshop, status } = req.query;

  if (workshop !== undefined && typeof workshop !== "string") {
    return res.status(400).json({ message: "workshop must be a single value" });
  }

  if (status !== undefined && typeof status !== "string") {
    return res.status(400).json({ message: "status must be a single value" });
  }

  if (status && !statuses.includes(status)) {
    return res.status(400).json({
      message: "status must be one of: " + statuses.join(", "),
    });
  }

  const filters = {};
  if (workshop) filters.workshop = workshop;
  if (status) filters.status = status;

  try {
    const machines = await machineService.getMachines(filters);
    return res.status(200).json({ machines });
  } catch (error) {
    return handleError(res, error);
  }
};

const getMachineById = async (req, res) => {
  try {
    const machine = await machineService.getMachineById(req.params.id);
    if (!machine) {
      return res.status(404).json({ message: "Machine not found" });
    }
    return res.status(200).json({ machine });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateMachine = async (req, res) => {
  const body = req.body || {};
  const updates = {};

  for (const field of ["name", "workshop"]) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      if (typeof body[field] !== "string" || body[field].trim() === "") {
        return res.status(400).json({
          message: field + " must be a non-empty string",
        });
      }
      updates[field] = body[field];
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "status")) {
    if (!statuses.includes(body.status)) {
      return res.status(400).json({
        message: "status must be one of: " + statuses.join(", "),
      });
    }
    updates.status = body.status;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      message: "Provide at least one of name, workshop or status to update",
    });
  }

  try {
    const machine = await machineService.updateMachineById(
      req.params.id,
      updates,
    );
    if (!machine) {
      return res.status(404).json({ message: "Machine not found" });
    }
    return res.status(200).json({ machine });
  } catch (error) {
    return handleError(res, error);
  }
};

const deleteMachine = async (req, res) => {
  try {
    const machine = await machineService.deleteMachineById(req.params.id);
    if (!machine) {
      return res.status(404).json({ message: "Machine not found" });
    }
    return res.status(200).json({
      message: "Machine deleted successfully",
      machine,
    });
  } catch (error) {
    if (error.status === 400 && error.message === "Cannot delete machine with existing reports") {
      return res.status(400).json({
        message: "Cannot delete machine with existing reports",
        reportCount: error.reportCount,
      });
    }
    return handleError(res, error);
  }
};

const getMachineReports = async (req, res) => {
  try {
    const machineReports = await machineService.getMachineReports(req.params.id);
    if (!machineReports) {
      return res.status(404).json({ message: "Machine not found" });
    }
    return res.status(200).json({ reports: machineReports });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  createMachine,
  getMachines,
  getMachineById,
  updateMachine,
  deleteMachine,
  getMachineReports,
};
