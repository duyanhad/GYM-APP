// backend/routes/sessionRoutes.js
const express = require("express");
const WorkoutSession = require("../models/WorkoutSession");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * ============================================
 * ⭐ MOBILE APP — KẾT THÚC BUỔI TẬP
 * POST /api/workout/finish
 * ============================================
 */
router.post("/workout/finish", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      durationSeconds,
      totalExercises,
      completedExercises,
      exercises,
      details,        // ⭐ THÊM
      startedAt,
      calories,
      note,
    } = req.body;

    const durationMinutes = Math.round((durationSeconds || 0) / 60);

    const session = await WorkoutSession.create({
      user: userId,
      date: new Date(),
      startedAt: startedAt ? new Date(startedAt) : undefined,
      duration: durationMinutes,
      totalExercises: totalExercises || exercises?.length || 0,
      completedExercises: completedExercises || 0,
      exercises: Array.isArray(exercises) ? exercises : [],
      
      // ⭐⭐ GHÉP CHUẨN — LƯU CHI TIẾT BUỔI TẬP
      details: Array.isArray(details) ? details : [],

      calories: calories || 0,
      note: note || "",
      source: "mobile",
    });

    res.status(201).json(session);
  } catch (err) {
    console.error("Finish workout error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ============================================
 * ⭐ WEB / ADMIN — THÊM SESSION THỦ CÔNG
 * POST /api/sessions
 * ============================================
 */
router.post("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      date,
      duration,
      calories,
      exercises,
      details,    // ⭐ THÊM
      note,
    } = req.body;

    const session = await WorkoutSession.create({
      user: userId,
      date: date ? new Date(date) : new Date(),
      duration: duration || 0,
      calories: calories || 0,
      exercises: Array.isArray(exercises) ? exercises : [],

      // ⭐⭐ GHÉP CHUẨN — LƯU CHI TIẾT
      details: Array.isArray(details) ? details : [],

      note: note || "",
      source: "web",
    });

    res.status(201).json(session);
  } catch (err) {
    console.error("Create session error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ============================================
 * ⭐ LẤY DANH SÁCH SESSION
 * GET /api/sessions
 * ============================================
 */
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { from, to } = req.query;
    const filter = { user: userId };

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const sessions = await WorkoutSession.find(filter).sort({ date: 1 });

    res.json(sessions);
  } catch (err) {
    console.error("Get sessions error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ============================================
 * ⭐ LẤY BUỔI TẬP THEO NGÀY
 * GET /api/sessions/by-date/:date
 * ============================================
 */
router.get("/by-date/:date", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date } = req.params;

    const target = new Date(date);
    if (Number.isNaN(target.getTime())) {
      return res.status(400).json({ message: "Ngày không hợp lệ" });
    }

    const startOfDay = new Date(target);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(target);
    endOfDay.setHours(23, 59, 59, 999);

    const sessions = await WorkoutSession.find({
      user: userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ date: 1, createdAt: 1 });

    if (!sessions.length) {
      return res
        .status(404)
        .json({ message: "Không có buổi tập trong ngày này" });
    }

    res.json(sessions);
  } catch (err) {
    console.error("Get session by date error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ============================================
 * ⭐ XOÁ BUỔI TẬP THEO NGÀY
 * DELETE /api/sessions/by-date/:date
 * ============================================
 */
router.delete("/by-date/:date", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date } = req.params;

    const target = new Date(date);
    if (Number.isNaN(target.getTime())) {
      return res.status(400).json({ message: "Ngày không hợp lệ" });
    }

    const startOfDay = new Date(target);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(target);
    endOfDay.setHours(23, 59, 59, 999);

    await WorkoutSession.deleteMany({
      user: userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    res.json({ message: "Đã xoá tất cả buổi tập trong ngày" });
  } catch (err) {
    console.error("Delete sessions error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
