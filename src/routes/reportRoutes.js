const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const reportController = require("../controllers/reportController");

const router = express.Router();
router.use(authMiddleware);
router.post("/", reportController.createReport);
router.get("/", reportController.getReports);
router.get("/:id", reportController.getReportById);
router.patch("/:id", reportController.updateReport);

module.exports = router;
