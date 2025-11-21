// backend/routes/exerciseRoutes.js
const express = require("express");
const Exercise = require("../models/Exercise");

// 👇 IMPORT ĐÚNG MIDDLEWARE
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

// Lấy all exercise
router.get("/", verifyToken, async (req, res) => {
  try {
    const exercises = await Exercise.find();
    res.json(exercises);
  } catch (err) {
    console.error("Get exercise error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Tạo new exercise (sau có thể thêm role admin)
router.post("/", verifyToken, async (req, res) => {
  try {
    const exercise = await Exercise.create(req.body);
    res.status(201).json(exercise);
  } catch (err) {
    console.error("Create exercise error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
