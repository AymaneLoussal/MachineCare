const machineService = require("../services/machineService");

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
  try {
    const { reference, name, workshop, status } = req.body || {};
    const machine = await machineService.createMachine({
      reference,
      name,
      workshop,
      status,
    });
    return res.status(201).json({ machine });
  } catch (error) {
    return handleError(res, error);
  }
};

const getMachines = async (req, res) => {
  try {
    const machines = await machineService.getMachines({});
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
  for (const field of ["name", "workshop", "status"]) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      updates[field] = body[field];
    }
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      message: "Provide at least one of name, workshop or status to update",
    });
  }

  try {
    const machine = await machineService.updateMachineById(req.params.id, updates);
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
    return handleError(res, error);
  }
};

module.exports = {
  createMachine,
  getMachines,
  getMachineById,
  updateMachine,
  deleteMachine,
};
