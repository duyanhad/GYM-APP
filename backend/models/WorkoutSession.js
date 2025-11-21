// backend/models/WorkoutSession.js
const mongoose = require("mongoose");

const workoutSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Thời điểm kết thúc buổi tập (dùng cho lịch)
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Thời gian tập (phút)
    duration: {
      type: Number,
      default: 0,
    },

    // Calories đốt
    calories: {
      type: Number,
      default: 0,
    },

    // Danh sách bài tập dạng text: ["Squat 4x10", "Bench Press 4x8", ...]
    exercises: [
      {
        type: String,
      },
    ],

    // Ghi chú
    note: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WorkoutSession", workoutSessionSchema);
