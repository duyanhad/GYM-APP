// frontend/api/workout.js
import axios from "axios";

// Nếu bạn đang dùng EXPO_PUBLIC_API_URL
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://192.168.0.103:4000";

// ===============================
// LẤY TOKEN TỰ ĐỘNG (nếu cần)
// ===============================
const authHeader = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// =====================================
// ⭐ 1. Lấy danh sách bài tập (nếu cần)
// =====================================
export const getExercises = async (token) => {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/api/exercises`,
      authHeader(token)
    );
    return res.data;
  } catch (err) {
    console.log("Get exercises error:", err?.response?.data || err);
    throw err;
  }
};

// =====================================
// ⭐ 2. Tạo bài tập mới (web/admin)
// =====================================
export const createExercise = async (token, data) => {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/api/exercises`,
      data,
      authHeader(token)
    );
    return res.data;
  } catch (err) {
    console.log("Create exercise error:", err?.response?.data || err);
    throw err;
  }
};

// =====================================================
// ⭐⭐ 3. LƯU BUỔI TẬP TỪ MOBILE → /api/workout/finish
// =====================================================
export const finishWorkoutSession = async (token, payload) => {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/api/workout/finish`,
      payload,
      authHeader(token)
    );

    return res.data;
  } catch (err) {
    console.log("Finish workout API error:", err?.response?.data || err);
    throw err;
  }
};

// =====================================================
// ⭐ 4. Lấy lịch sử buổi tập theo ngày (History Screen)
// =====================================================
export const getSessionsByDate = async (token, date) => {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/api/sessions/by-date/${date}`,
      authHeader(token)
    );

    return res.data;
  } catch (err) {
    console.log("Get session by date error:", err?.response?.data || err);
    throw err;
  }
};

// =====================================================
// ⭐ 5. Xóa tất cả buổi tập theo ngày (RESET)
// =====================================================
export const deleteSessionsByDate = async (token, date) => {
  try {
    const res = await axios.delete(
      `${API_BASE_URL}/api/sessions/by-date/${date}`,
      authHeader(token)
    );

    return res.data;
  } catch (err) {
    console.log("Delete sessions error:", err?.response?.data || err);
    throw err;
  }
};

// =====================================================
// ⭐ 6. Lọc theo khoảng ngày (nếu dùng dashboard)
// =====================================================
export const getSessionsInRange = async (token, from, to) => {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/api/sessions?from=${from}&to=${to}`,
      authHeader(token)
    );

    return res.data;
  } catch (err) {
    console.log("Get sessions range error:", err?.response?.data || err);
    throw err;
  }
};
