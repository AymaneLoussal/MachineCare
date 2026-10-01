const Machine = require("../models/machine");

const createMachine = (machineData) => Machine.create(machineData);

const getMachines = (filters) => Machine.find(filters);

const getMachineById = (id) => Machine.findById(id);

const updateMachineById = (id, updates) =>
  Machine.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

const deleteMachineById = (id) => Machine.findByIdAndDelete(id);

module.exports = {
  createMachine,
  getMachines,
  getMachineById,
  updateMachineById,
  deleteMachineById,
};
