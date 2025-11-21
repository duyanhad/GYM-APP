// backend/routes/sessionRoutes.js
const express = require("express");
const WorkoutSession = require("../models/WorkoutSession");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * POST /api/sessions
 * Body: { date?, duration, calories, exercises, note }
 * -> Lưu 1 buổi tập mới cho user hiện tại
 */
router.post("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date, duration, calories, exercises, note } = req.body;

    const session = await WorkoutSession.create({
      user: userId,
      date: date ? new Date(date) : new Date(),
      duration: duration || 0,
      calories: calories || 0,
      exercises: Array.isArray(exercises) ? exercises : [],
      note: note || "",
    });

    res.status(201).json(session);
  } catch (err) {
    console.error("Create session error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/sessions?from=YYYY-MM-DD&to=YYYY-MM-DD
 * -> Lấy toàn bộ session của user (có thể lọc theo khoảng ngày)
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
 * GET /api/sessions/by-date/:date (YYYY-MM-DD)
 * -> Lấy TẤT CẢ buổi tập trong 1 ngày (array)
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
 * DELETE /api/sessions/by-date/:date (YYYY-MM-DD)
 * -> Xoá toàn bộ buổi tập trong ngày
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
