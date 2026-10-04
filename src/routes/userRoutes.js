const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const userController = require("../controllers/userController");

const router = express.Router();

router.post("/", authMiddleware, userController.createUser);
router.get("/me", authMiddleware, userController.getProfile);
router.put("/me", authMiddleware, userController.updateProfile);

module.exports = router;
