import React, { useState, useEffect, useRef, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios"; // ⭐ THÊM ĐÚNG Ở ĐÂY
import * as Haptics from "expo-haptics";

import { WorkoutContext } from "../../context/WorkoutContext";
import { AuthContext } from "../../context/AuthContext";

// ❌ XOÁ import cũ finishWorkoutSession
// import { finishWorkoutSession } from "../../api/workout";

export default function WorkoutSessionScreen({ navigation }) {
  const { activeSession, resetSession } = useContext(WorkoutContext);
  const { userToken } = useContext(AuthContext);

  const invalidSession =
    !activeSession ||
    !activeSession.isTraining ||
    !Array.isArray(activeSession.exercises) ||
    activeSession.exercises.length === 0;

  const exerciseList = activeSession?.exercises || [];

  const [progress, setProgress] = useState(exerciseList.map(() => false));
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  const [resting, setResting] = useState(false);
  const [restTime, setRestTime] = useState(60);
  const restRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed((t) => t + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (restRef.current) clearInterval(restRef.current);
    };
  }, []);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const toggleComplete = (idx) => {
    const updated = [...progress];
    updated[idx] = !updated[idx];
    setProgress(updated);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const completedCount = progress.filter(Boolean).length;
  const totalExercises = exerciseList.length;
  const percent =
    totalExercises === 0
      ? 0
      : Math.round((completedCount / totalExercises) * 100);

  const startRest = () => {
    if (resting) return;

    setResting(true);
    setRestTime(60);

    if (restRef.current) clearInterval(restRef.current);
    restRef.current = setInterval(() => {
      setRestTime((s) => {
        if (s <= 1) {
          clearInterval(restRef.current);
          setResting(false);
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const stopRest = () => {
    if (restRef.current) clearInterval(restRef.current);
    setResting(false);
    setRestTime(60);
  };

  // ================== KẾT THÚC BUỔI TẬP ==================
  const handleFinish = () => {
    Alert.alert(
      "Kết thúc buổi tập?",
      "Buổi tập sẽ được lưu vào lịch sử và điểm danh.",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Kết thúc",
          style: "destructive",
          onPress: async () => {
            try {
              if (timerRef.current) clearInterval(timerRef.current);
              if (restRef.current) clearInterval(restRef.current);

              const durationMinutes = Math.max(Math.floor(elapsed / 60), 1);
              const calories = durationMinutes * 8;

              const today = new Date();
              const todayStr = `${today.getFullYear()}-${String(
                today.getMonth() + 1
              ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

              const payload = {
                date: todayStr,
                duration: durationMinutes,
                calories,
                exercises: exerciseList,
                note: "Buổi tập được lưu khi bạn bấm kết thúc.",
              };

              // ⭐ LƯU ĐÚNG DẠNG API SESSION CỦA HISTORY.JSX
              if (userToken) {
                await axios.post(
                  "http://192.168.0.103:4000/api/sessions",
                  payload,
                  { headers: { Authorization: `Bearer ${userToken}` } }
                );
              }

              resetSession();
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );

              navigation.goBack();
            } catch (e) {
              console.log("Lỗi finish:", e?.message);
              Alert.alert("Lỗi", "Không thể lưu buổi tập.");
            }
          },
        },
      ]
    );
  };

  // ================== RETURN ==================
  if (invalidSession) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Chưa có buổi tập nào đang diễn ra.</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đang tập luyện</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.timerBox}>
        <Ionicons name="time-outline" size={28} color="#00ffcc" />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.timerLabel}>Thời gian buổi tập</Text>
          <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
        </View>
      </View>

      {resting && (
        <View style={styles.restBox}>
          <Ionicons name="hourglass-outline" size={24} color="#ffcc00" />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.restLabel}>Đang nghỉ giữa set</Text>
            <Text style={styles.restText}>{restTime}s</Text>
          </View>
          <TouchableOpacity style={styles.restStopBtn} onPress={stopRest}>
            <Text style={styles.restStopText}>Bỏ qua</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.progressBox}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            Tiến độ: {completedCount}/{totalExercises} bài · {percent}%
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[styles.progressBarFill, { width: `${percent}%` }]}
          />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, marginTop: 15 }}
        showsVerticalScrollIndicator={false}
      >
        {exerciseList.map((item, index) => (
          <View
            key={index}
            style={[
              styles.exerciseCard,
              progress[index] && styles.exerciseCardDone,
            ]}
          >
            <TouchableOpacity
              style={styles.checkBtn}
              onPress={() => toggleComplete(index)}
            >
              <Ionicons
                name={
                  progress[index] ? "checkbox-outline" : "square-outline"
                }
                size={26}
                color={progress[index] ? "#00ffcc" : "#666"}
              />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={styles.exerciseName}>{item}</Text>
              {progress[index] && (
                <Text style={styles.exerciseDoneText}>Đã hoàn thành</Text>
              )}
            </View>

            <TouchableOpacity style={styles.setBtn} onPress={startRest}>
              <Text style={styles.setBtnText}>+ Set</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={{ height: 80 }} />
      </ScrollView>

      <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
        <Text style={styles.finishText}>Kết thúc buổi tập</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ========================= STYLE ========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 50,
    paddingHorizontal: 18,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    color: "#ccc",
    fontSize: 16,
    marginBottom: 10,
  },
  backBtn: {
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#00ffcc",
  },
  backBtnText: {
    color: "#00ffcc",
    fontWeight: "700",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },

  timerBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#050b0a",
    borderWidth: 1,
    borderColor: "#00ffcc55",

    shadowColor: "#00ffcc",
    shadowOpacity: 0.7,
    shadowRadius: 18,
  },
  timerLabel: {
    color: "#888",
    fontSize: 13,
  },
  timerText: {
    color: "#00ffcc",
    fontSize: 22,
    fontWeight: "800",
  },

  restBox: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#221a00",
    borderWidth: 1,
    borderColor: "#ffcc00aa",
  },
  restLabel: {
    color: "#ffdd66",
    fontSize: 13,
  },
  restText: {
    color: "#ffcc00",
    fontSize: 20,
    fontWeight: "700",
  },
  restStopBtn: {
    marginLeft: "auto",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ffcc00",
  },
  restStopText: {
    color: "#ffcc00",
    fontSize: 12,
    fontWeight: "600",
  },

  progressBox: {
    marginTop: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressText: {
    color: "#ccc",
    fontSize: 14,
    fontWeight: "600",
  },
  progressBarBg: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#222",
    overflow: "hidden",
  },
  progressBarFill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#00ffcc",
  },

  exerciseCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  exerciseCardDone: {
    borderColor: "#00ffcc",
    backgroundColor: "#041512",
  },
  checkBtn: {
    marginRight: 10,
  },
  exerciseName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  exerciseDoneText: {
    marginTop: 2,
    color: "#00ffcc",
    fontSize: 12,
  },

  setBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#00ffcc",
  },
  setBtnText: {
    color: "#000",
    fontSize: 13,
    fontWeight: "700",
  },

  finishBtn: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 24,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "#00ffcc",
    alignItems: "center",
  },
  finishText: {
    color: "#000",
    fontSize: 17,
    fontWeight: "800",
  },
});
