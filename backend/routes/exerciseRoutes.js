// backend/routes/exerciseRoutes.js
const express = require("express");
const router = express.Router();
const Exercise = require("../models/Exercise");
const { verifyToken } = require("../middleware/authMiddleware");

// ===== GET all with filter =====
router.get("/", verifyToken, async (req, res) => {
  try {
    const { muscleGroup, search, difficulty } = req.query;

    const filter = { isActive: true };

    if (muscleGroup) filter.muscleGroup = muscleGroup;
    if (difficulty) filter.difficulty = difficulty;

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const list = await Exercise.find(filter).sort({ name: 1 });
    res.json(list);
  } catch (err) {
    console.error("Get exercise error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== GET one =====
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const ex = await Exercise.findById(req.params.id);
    if (!ex) return res.status(404).json({ message: "Exercise not found" });
    res.json(ex);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ===== CREATE =====
router.post("/", verifyToken, async (req, res) => {
  try {
    const exists = await Exercise.findOne({
      name: req.body.name.trim(),
      muscleGroup: req.body.muscleGroup
    });

    if (exists) {
      return res.status(400).json({ message: "Bài tập đã tồn tại" });
    }

    const newEx = await Exercise.create({
      name: req.body.name.trim(),
      muscleGroup: req.body.muscleGroup,
      equipment: req.body.equipment,
      difficulty: req.body.difficulty,
      description: req.body.description,
      createdBy: "admin"
    });

    res.status(201).json(newEx);
  } catch (err) {
    console.error("Create exercise error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== UPDATE =====
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const updated = await Exercise.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });

    if (!updated)
      return res.status(404).json({ message: "Exercise not found" });

    res.json(updated);
  } catch (err) {
    console.error("Update exercise error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== DELETE (soft delete) =====
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const ex = await Exercise.findById(req.params.id);
    if (!ex) return res.status(404).json({ message: "Exercise not found" });

    ex.isActive = false;
    await ex.save();

    res.json({ message: "Exercise disabled" });
  } catch (err) {
    console.error("Delete exercise error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
