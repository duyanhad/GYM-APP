// backend/routes/workoutExtraRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const WorkoutSession = require("../models/WorkoutSession");

// ============================================================
// ⭐ 1. LẤY BUỔI TẬP HÔM NAY
// GET /api/workout/today
// ============================================================
router.get("/today", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

    const todaySessions = await WorkoutSession.find({
      user: userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ date: 1 });

    res.json(todaySessions);
  } catch (err) {
    console.error("Error fetching today workout:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================================
// ⭐ 2. SUMMARY — Tổng hợp thống kê
// GET /api/workout/summary
// ============================================================
router.get("/summary", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const sessions = await WorkoutSession.find({ user: userId });

    if (!sessions.length) {
      return res.json({
        totalSessions: 0,
        totalDuration: 0,
        totalExercises: 0,
        totalCompleted: 0,
        totalCalories: 0,
      });
    }

    const summary = {
      totalSessions: sessions.length,
      totalDuration: sessions.reduce((sum, s) => sum + (s.duration || 0), 0),
      totalExercises: sessions.reduce(
        (sum, s) => sum + (s.totalExercises || 0),
        0
      ),
      totalCompleted: sessions.reduce(
        (sum, s) => sum + (s.completedExercises || 0),
        0
      ),
      totalCalories: sessions.reduce((sum, s) => sum + (s.calories || 0), 0),
    };

    res.json(summary);
  } catch (err) {
    console.error("Summary error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================================
// ⭐ 3. ROUTINE / PRESET
// GET /api/workout-presets
// POST /api/workout-presets/bulk
// ============================================================

const PresetStorage = []; // tạm thời lưu memory — có thể lưu DB sau

router.get("/presets", async (req, res) => {
  try {
    res.json(PresetStorage);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Lưu toàn bộ preset (frontend gửi danh sách FULL)
router.post("/presets/bulk", async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ message: "Invalid format" });
    }

    PresetStorage.length = 0;
    req.body.forEach((p) => PresetStorage.push(p));

    res.json({ message: "Presets saved" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
