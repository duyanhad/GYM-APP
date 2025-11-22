// backend/models/WorkoutSession.js
const mongoose = require("mongoose");

const workoutSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Thời điểm kết thúc buổi tập (dùng cho lịch / thống kê)
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Thời điểm bắt đầu buổi tập (để biết chính xác time)
    startedAt: {
      type: Date,
    },

    // Thời gian tập (PHÚT)
    duration: {
      type: Number,
      default: 0,
    },

    // Tổng số bài trong buổi tập
    totalExercises: {
      type: Number,
      default: 0,
    },

    // Số bài đã tick hoàn thành
    completedExercises: {
      type: Number,
      default: 0,
    },

    // Calories đốt
    calories: {
      type: Number,
      default: 0,
    },

    // Danh sách bài tập dạng text
    exercises: [
      {
        type: String,
      },
    ],

    // ⭐⭐⭐ CHỈ SỬA THÊM PHẦN NÀY — KHÔNG SỬA GÌ KHÁC ⭐⭐⭐
    details: [
      {
        name: { type: String },
        sets: { type: Number },
        skipped: { type: Boolean },
        note: { type: String },
        done: { type: Boolean },
      },
    ],
    // ⭐⭐⭐ HẾT — KHÔNG SỬA GÌ KHÁC ⭐⭐⭐

    // Ghi chú
    note: {
      type: String,
      default: "",
    },

    // Nguồn tạo buổi tập
    source: {
      type: String,
      enum: ["web", "mobile"],
      default: "mobile",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WorkoutSession", workoutSessionSchema);
