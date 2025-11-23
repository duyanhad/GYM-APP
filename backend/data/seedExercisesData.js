const mongoose = require("mongoose");
const Exercise = require("../models/Exercise");
require("dotenv").config();

const exercises = [
  // ====================================
  // LEGS (ĐÙI TRƯỚC)
  // ====================================
  { name: "Back Squat", muscleGroup: "legs" },
  { name: "Front Squat", muscleGroup: "legs" },
  { name: "Goblet Squat", muscleGroup: "legs" },
  { name: "Leg Press", muscleGroup: "legs" },
  { name: "Hack Squat", muscleGroup: "legs" },
  { name: "Walking Lunges", muscleGroup: "legs" },
  { name: "Bulgarian Split Squat", muscleGroup: "legs" },
  { name: "Step-ups", muscleGroup: "legs" },
  { name: "Wall Sit", muscleGroup: "legs" },
  { name: "Jump Squat", muscleGroup: "legs" },

  // ====================================
  // HAMSTRINGS – MẮT CÁ CHÂN SAU
  // ====================================
  { name: "Romanian Deadlift", muscleGroup: "hamstrings" },
  { name: "Stiff-Leg Deadlift", muscleGroup: "hamstrings" },
  { name: "Hamstring Curl Machine", muscleGroup: "hamstrings" },
  { name: "Glute Ham Raise", muscleGroup: "hamstrings" },
  { name: "Nordic Hamstring Curl", muscleGroup: "hamstrings" },

  // ====================================
  // GLUTES – MÔNG
  // ====================================
  { name: "Hip Thrust", muscleGroup: "glutes" },
  { name: "Glute Bridge", muscleGroup: "glutes" },
  { name: "Cable Kickback", muscleGroup: "glutes" },
  { name: "Sumo Deadlift", muscleGroup: "glutes" },
  { name: "Curtsy Lunge", muscleGroup: "glutes" },

  // ====================================
  // CHEST – NGỰC
  // ====================================
  { name: "Bench Press", muscleGroup: "chest" },
  { name: "Incline Bench Press", muscleGroup: "chest" },
  { name: "Decline Bench Press", muscleGroup: "chest" },
  { name: "Dumbbell Chest Fly", muscleGroup: "chest" },
  { name: "Cable Chest Fly", muscleGroup: "chest" },
  { name: "Push-ups", muscleGroup: "chest" },
  { name: "Weighted Dips", muscleGroup: "chest" },

  // ====================================
  // BACK – LƯNG
  // ====================================
  { name: "Deadlift", muscleGroup: "back" },
  { name: "Barbell Row", muscleGroup: "back" },
  { name: "T-Bar Row", muscleGroup: "back" },
  { name: "Dumbbell Row", muscleGroup: "back" },
  { name: "Lat Pulldown", muscleGroup: "back" },
  { name: "Pull-ups", muscleGroup: "back" },
  { name: "Chin-ups", muscleGroup: "back" },
  { name: "Seated Row", muscleGroup: "back" },
  { name: "Face Pull", muscleGroup: "back" },

  // ====================================
  // SHOULDERS – VAI
  // ====================================
  { name: "Overhead Press", muscleGroup: "shoulders" },
  { name: "Arnold Press", muscleGroup: "shoulders" },
  { name: "Lateral Raise", muscleGroup: "shoulders" },
  { name: "Front Raise", muscleGroup: "shoulders" },
  { name: "Rear Delt Fly", muscleGroup: "shoulders" },

  // ====================================
  // BICEPS – TAY TRƯỚC
  // ====================================
  { name: "Bicep Curl", muscleGroup: "biceps" },
  { name: "Hammer Curl", muscleGroup: "biceps" },
  { name: "EZ Bar Curl", muscleGroup: "biceps" },
  { name: "Cable Curl", muscleGroup: "biceps" },
  { name: "Concentration Curl", muscleGroup: "biceps" },
  { name: "Preacher Curl", muscleGroup: "biceps" },

  // ====================================
  // TRICEPS – TAY SAU
  // ====================================
  { name: "Tricep Pushdown", muscleGroup: "triceps" },
  { name: "Skullcrusher", muscleGroup: "triceps" },
  { name: "Overhead Tricep Extension", muscleGroup: "triceps" },
  { name: "Diamond Push-ups", muscleGroup: "triceps" },
  { name: "Dips", muscleGroup: "triceps" },

  // ====================================
  // ABS – BỤNG / CORE
  // ====================================
  { name: "Crunch", muscleGroup: "abs" },
  { name: "Leg Raise", muscleGroup: "abs" },
  { name: "Hanging Leg Raise", muscleGroup: "abs" },
  { name: "Cable Crunch", muscleGroup: "abs" },
  { name: "Plank", muscleGroup: "abs" },
  { name: "Russian Twist", muscleGroup: "abs" },
  { name: "Mountain Climbers", muscleGroup: "abs" },
  { name: "V-Sit", muscleGroup: "abs" },
  { name: "Toe Touch", muscleGroup: "abs" },

  // ====================================
  // CARDIO
  // ====================================
  { name: "Running", muscleGroup: "cardio" },
  { name: "Treadmill Sprint", muscleGroup: "cardio" },
  { name: "Cycling", muscleGroup: "cardio" },
  { name: "Rowing Machine", muscleGroup: "cardio" },
  { name: "Jump Rope", muscleGroup: "cardio" },
  { name: "Stair Climber", muscleGroup: "cardio" },

  // ====================================
  // FULL BODY / HIIT
  // ====================================
  { name: "Burpees", muscleGroup: "fullbody" },
  { name: "Kettlebell Swing", muscleGroup: "fullbody" },
  { name: "Box Jump", muscleGroup: "fullbody" },
  { name: "Battle Rope", muscleGroup: "fullbody" },
  { name: "Jumping Jack", muscleGroup: "fullbody" },
  { name: "Sled Push", muscleGroup: "fullbody" },
  { name: "Farmer Walk", muscleGroup: "fullbody" },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await Exercise.deleteMany();
    await Exercise.insertMany(exercises);

    console.log("🔥 Seed dữ liệu bài tập FULL THÀNH CÔNG!");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
