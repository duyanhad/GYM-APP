const express = require("express");
const Workout = require("../models/Workout");

// Lấy đúng middleware verifyToken
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

// Lấy danh sách workout của user
router.get("/", verifyToken, async (req, res) => {
  try {
    const workouts = await Workout.find({ user: req.user.userId })
      .populate("exercises.exercise");

    res.json(workouts);
  } catch (err) {
    console.error("Get workouts error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Tạo workout mới
router.post("/", verifyToken, async (req, res) => {
  try {
    const { name, exercises } = req.body;

    const workout = await Workout.create({
      user: req.user.userId,
      name,
      exercises
    });

    res.status(201).json(workout);
  } catch (err) {
    console.error("Create workout error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
