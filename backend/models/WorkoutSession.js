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

    // Calories đốt (tạm thời 0 – sau này nếu có công thức thì update)
    calories: {
      type: Number,
      default: 0,
    },

    // Danh sách bài tập dạng text:
    // ["Deadlift – 4 x 8 (back)", "Squat – 3 x 12 (legs)", ...]
    exercises: [
      {
        type: String,
      },
    ],

    // Ghi chú
    note: {
      type: String,
      default: "",
    },

    // Nguồn tạo buổi tập (web / mobile)
    source: {
      type: String,
      enum: ["web", "mobile"],
      default: "mobile",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WorkoutSession", workoutSessionSchema);
