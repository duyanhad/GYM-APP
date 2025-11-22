// backend/scripts/seedExercises.js
require("dotenv").config();
const mongoose = require("mongoose");
const Exercise = require("../models/Exercise");

const data = require("../data/seedExercisesData");

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");

    await Exercise.deleteMany({ createdBy: "seed-advanced" });

    const docs = data.map((ex) => ({
      ...ex,
      difficulty: "intermediate",
      createdBy: "seed-advanced"
    }));

    await Exercise.insertMany(docs);

    console.log(`Seed thành công: ${docs.length} bài tập (Gói B nâng cao)`);
    process.exit();
  })
  .catch((err) => console.error(err));
