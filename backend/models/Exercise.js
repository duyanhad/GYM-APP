// backend/models/Exercise.js
const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    // Nhóm cơ nâng cao (gói B)
    muscleGroup: {
      type: String,
      required: true,
      enum: [
        "legs",
        "quads",
        "hamstrings",
        "calves",
        "glutes",
        "back",
        "chest",
        "shoulders",
        "biceps",
        "triceps",
        "abs",
        "waist",
        "cardio",
        "fullbody"
      ]
    },

    // Loại dụng cụ — để lọc sau này
    equipment: {
      type: String,
      enum: [
        "bodyweight",
        "barbell",
        "dumbbell",
        "machine",
        "cable",
        "kettlebell",
        "band",
        "cardio_machine",
        "other"
      ],
      default: "bodyweight"
    },

    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner"
    },

    description: { type: String, default: "" },

    // ⭐ THÊM PHẦN CHI TIẾT CHUYÊN NGHIỆP
    primaryMuscle: { type: String, default: "" },

    secondaryMuscles: {
      type: [String],
      default: []
    },

    instructions: {
      type: [String], // từng bước hướng dẫn
      default: []
    },

    imageUrl: { type: String, default: "" }, // ảnh minh hoạ
    videoUrl: { type: String, default: "" }, // video hướng dẫn

    caloriesBurned: { type: Number, default: 0 }, // đốt calo ước tính

    tags: {
      type: [String], // ví dụ: ["strength", "hypertrophy", "core"]
      default: []
    },

    isActive: { type: Boolean, default: true },

    createdBy: { type: String, default: "seed-advanced" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exercise", exerciseSchema);
