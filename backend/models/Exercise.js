// backend/models/Exercise.js
const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    muscleGroup: { type: String, required: true }, // chest, legs, back...
    description: { type: String },
    suggestedSets: { type: Number, default: 3 },
    suggestedReps: { type: Number, default: 10 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exercise", exerciseSchema);