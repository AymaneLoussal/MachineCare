const Machine = require("../models/machine");
const Report = require("../models/report");

const createMachine = (machineData) => Machine.create(machineData);

const getMachines = (filters) => Machine.find(filters);

const getMachineById = (id) => Machine.findById(id);

const updateMachineById = (id, updates) =>
  Machine.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

const deleteMachineById = async (id) => {
  const reportCount = await Report.countDocuments({ machine: id });
  if (reportCount > 0) {
    const error = new Error("Cannot delete machine with existing reports");
    error.status = 400;
    error.reportCount = reportCount;
    throw error;
  }
  return Machine.findByIdAndDelete(id);
};

const getMachineReports = async (machineId) => {
  const machine = await Machine.findById(machineId);
  if (!machine) {
    return null;
  }
  return Report.find({ machine: machineId });
};

module.exports = {
  createMachine,
  getMachines,
  getMachineById,
  updateMachineById,
  deleteMachineById,
  getMachineReports,
};
