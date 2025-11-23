import axios from "axios";

const API = process.env.EXPO_PUBLIC_API_URL || "http://192.168.0.103:4000";

/**
 * Lấy danh sách bài tập theo nhóm cơ
 */
export const getExercisesByGroup = async (token, muscleGroup) => {
  try {
    const res = await axios.get(
      `${API}/api/exercises?muscleGroup=${muscleGroup}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (err) {
    console.log("❌ Lỗi getExercisesByGroup:", err.response?.data || err);
    throw err;
  }
};

/**
 * Search bài tập theo keyword
 */
export const searchExercises = async (token, keyword) => {
  try {
    const res = await axios.get(`${API}/api/exercises?search=${keyword}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    console.log("❌ Lỗi searchExercises:", err.response?.data || err);
    throw err;
  }
};
