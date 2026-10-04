const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const machineController = require("../controllers/machineController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", machineController.createMachine);
router.get("/", machineController.getMachines);
router.get("/:id", machineController.getMachineById);
router.get("/:id/reports", machineController.getMachineReports);
router.put("/:id", machineController.updateMachine);
router.delete("/:id", machineController.deleteMachine);

module.exports = router;
