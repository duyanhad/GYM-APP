import React, { useState, useEffect, useRef, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";

import { WorkoutContext } from "../../context/WorkoutContext";
import { AuthContext } from "../../context/AuthContext";

export default function WorkoutSessionScreen({ navigation }) {
  const { activeSession, resetSession } = useContext(WorkoutContext);
  const { userToken } = useContext(AuthContext);

  const invalidSession =
    !activeSession ||
    !activeSession.isTraining ||
    !Array.isArray(activeSession.exercises) ||
    activeSession.exercises.length === 0;

  const exerciseList = activeSession?.exercises || [];

  // ======= STATE CHÍNH =======
  const [progress, setProgress] = useState(exerciseList.map(() => false)); // đã hoàn thành bài
  const [setCounts, setSetCounts] = useState(exerciseList.map(() => 0)); // số set/bài
  const [skipped, setSkipped] = useState(exerciseList.map(() => false)); // skip bài
  const [notes, setNotes] = useState(exerciseList.map(() => "")); // note từng bài

  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  const [resting, setResting] = useState(false);
  const [restTime, setRestTime] = useState(60);
  const [restDuration, setRestDuration] = useState(60); // thời gian nghỉ mặc định
  const restRef = useRef(null);

  const [targetCalories, setTargetCalories] = useState(250); // mục tiêu buổi tập

  // Countdown 3s trước khi bắt đầu
  const [showCountdown, setShowCountdown] = useState(true);
  const [countdown, setCountdown] = useState(3);

  // Modal chi tiết bài tập
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(null);

  // Modal ghi chú
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [editingNoteIndex, setEditingNoteIndex] = useState(null);
  const [tempNote, setTempNote] = useState("");

  // Modal tổng kết buổi tập
  const [finishModalVisible, setFinishModalVisible] = useState(false);

  // ======= VOICE COACH =======
  const speak = (text) => {
    try {
      Speech.speak(text, {
        language: "vi-VN",
        pitch: 1.0,
        rate: 1.0,
      });
    } catch (e) {
      // tránh crash nếu chưa cài expo-speech
      console.log("Speech error:", e?.message);
    }
  };

  // ======= COUNTDOWN & TIMER =======
  useEffect(() => {
    let countdownInterval = null;

    if (showCountdown) {
      setCountdown(3);
      speak("Chuẩn bị bắt đầu buổi tập");
      countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success
            );
            speak("Bắt đầu!");
            setShowCountdown(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      timerRef.current = setInterval(() => {
        setElapsed((t) => t + 1);
      }, 1000);
    }

    return () => {
      if (countdownInterval) clearInterval(countdownInterval);
      if (timerRef.current) clearInterval(timerRef.current);
      if (restRef.current) clearInterval(restRef.current);
    };
  }, [showCountdown]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  };

  const estimatedCalories = Math.max(
    Math.round((elapsed / 60) * 8), // 8 kcal/phút giống logic lưu
    0
  );

  // ======= TOGGLE HOÀN THÀNH BÀI =======
  const toggleComplete = (idx) => {
    const updated = [...progress];
    const newValue = !updated[idx];
    updated[idx] = newValue;
    setProgress(updated);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (newValue) {
      speak("Hoàn thành bài tập");
    }
  };

  // ======= THÊM SET =======
  const handleAddSet = (idx) => {
    const updated = [...setCounts];
    updated[idx] = (updated[idx] || 0) + 1;
    setSetCounts(updated);

    // Khi có set đầu tiên, coi như đã hoàn thành
    if (!progress[idx]) {
      const newProgress = [...progress];
      newProgress[idx] = true;
      setProgress(newProgress);
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    speak(`Thêm một set cho bài số ${idx + 1}`);
    startRest();
  };

  // ======= SKIP BÀI =======
  const toggleSkip = (idx) => {
    const updated = [...skipped];
    updated[idx] = !updated[idx];
    setSkipped(updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    speak(updated[idx] ? "Bỏ qua bài tập" : "Khôi phục bài tập");
  };

  // ======= REST TIMER =======
  const startRest = () => {
    if (resting) return;

    setResting(true);
    setRestTime(restDuration);

    if (restRef.current) clearInterval(restRef.current);
    speak(`Nghỉ ${restDuration} giây`);

    restRef.current = setInterval(() => {
      setRestTime((s) => {
        if (s <= 1) {
          clearInterval(restRef.current);
          setResting(false);
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );
          speak("Hết thời gian nghỉ, tiếp tục tập");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const stopRest = () => {
    if (restRef.current) clearInterval(restRef.current);
    setResting(false);
    setRestTime(restDuration);
  };

  // ======= PROGRESS & TỔNG KẾT =======
  const skippedCount = skipped.filter(Boolean).length;
  const totalExercises = exerciseList.length;
  const activeTotal = Math.max(totalExercises - skippedCount, 0);

  const completedCount = progress.reduce((count, done, idx) => {
    if (skipped[idx]) return count;
    return done ? count + 1 : count;
  }, 0);

  const percent =
    activeTotal === 0
      ? 0
      : Math.round((completedCount / activeTotal) * 100);

  const totalSets = setCounts.reduce((sum, n) => sum + (n || 0), 0);

  // ======= MODAL CHI TIẾT BÀI TẬP =======
  const openExerciseModal = (idx) => {
    setCurrentExerciseIndex(idx);
    setExerciseModalVisible(true);
  };

  // ======= MODAL GHI CHÚ =======
  const openNoteModal = (idx) => {
    setEditingNoteIndex(idx);
    setTempNote(notes[idx] || "");
    setNoteModalVisible(true);
  };

  const saveNote = () => {
    if (editingNoteIndex === null) return;
    const updated = [...notes];
    updated[editingNoteIndex] = tempNote;
    setNotes(updated);
    setNoteModalVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // ======= KẾT THÚC BUỔI TẬP (MỞ MODAL TÓM TẮT) =======
  const openFinishSummary = () => {
    if (elapsed < 10) {
      Alert.alert(
        "Buổi tập quá ngắn",
        "Bạn mới tập được rất ít. Bạn chắc chắn muốn kết thúc chứ?",
        [
          { text: "Tiếp tục tập", style: "cancel" },
          {
            text: "Vẫn kết thúc",
            style: "destructive",
            onPress: () => setFinishModalVisible(true),
          },
        ]
      );
    } else {
      setFinishModalVisible(true);
    }
  };

  // ======= GỬI LÊN BACKEND & RESET =======
  const confirmFinish = async () => {
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      if (restRef.current) clearInterval(restRef.current);

      const durationMinutes = Math.max(Math.floor(elapsed / 60), 1);
      const calories = durationMinutes * 8;

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      const details = exerciseList.map((name, idx) => ({
        name,
        sets: setCounts[idx] || 0,
        skipped: skipped[idx] || false,
        note: notes[idx] || "",
        done: progress[idx] || false,
      }));

      const payload = {
        date: todayStr,
        duration: durationMinutes,
        calories,
        exercises: exerciseList, // GIỮ NGUYÊN ĐÚNG FORMAT CŨ
        details, // thêm thông tin chi tiết, backend có thể dùng hoặc bỏ qua
        note: "Buổi tập được lưu khi bạn bấm kết thúc.",
      };

      if (userToken) {
        await axios.post("http://192.168.0.103:4000/api/sessions", payload, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
      }

      resetSession();
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
      speak("Hoàn thành buổi tập, rất tốt!");

      setFinishModalVisible(false);
      navigation.goBack();
    } catch (e) {
      console.log("Lỗi finish:", e?.message);
      Alert.alert("Lỗi", "Không thể lưu buổi tập.");
    }
  };

  // ================== RETURN ==================
  if (invalidSession) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Chưa có buổi tập nào đang diễn ra.
        </Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentExerciseName =
    currentExerciseIndex !== null
      ? exerciseList[currentExerciseIndex]
      : "";

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đang tập luyện</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* VÒNG TRÒN TIẾN ĐỘ + MỤC TIÊU */}
      <View style={styles.summaryRow}>
        <View style={styles.circleWrapper}>
          <View style={styles.circleOuter}>
            <View style={styles.circleInner}>
              <Text style={styles.circlePercent}>{percent}%</Text>
              <Text style={styles.circleLabel}>Hoàn thành</Text>
            </View>
          </View>
        </View>
        <View style={styles.summaryInfo}>
          <View style={styles.summaryItem}>
            <Ionicons name="flame-outline" size={20} color="#ff8800" />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.summaryLabel}>Calories ước tính</Text>
              <Text style={styles.summaryValue}>
                {estimatedCalories} kcal
              </Text>
            </View>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="flag-outline" size={20} color="#00ffcc" />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.summaryLabel}>Mục tiêu</Text>
              <Text style={styles.summaryValue}>
                {estimatedCalories}/{targetCalories} kcal
              </Text>
            </View>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="barbell-outline" size={20} color="#ffffff" />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.summaryLabel}>Tổng set</Text>
              <Text style={styles.summaryValue}>{totalSets} set</Text>
            </View>
          </View>
        </View>
      </View>

      {/* TIMER CHÍNH */}
      <View
        style={[
          styles.timerBox,
          {
            shadowOpacity: 0.4 + percent / 300, // glow mạnh dần theo % tiến độ
          },
        ]}
      >
        <Ionicons name="time-outline" size={28} color="#00ffcc" />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.timerLabel}>Thời gian buổi tập</Text>
          <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
        </View>
      </View>

      {/* CẤU HÌNH THỜI GIAN NGHỈ */}
      <View style={styles.restConfigRow}>
        <Text style={styles.restConfigLabel}>Thời gian nghỉ</Text>
        <View style={styles.restChipRow}>
          {[30, 60, 90].map((sec) => (
            <TouchableOpacity
              key={sec}
              onPress={() => {
                setRestDuration(sec);
                if (!resting) setRestTime(sec);
              }}
              style={[
                styles.restChip,
                restDuration === sec && styles.restChipActive,
              ]}
            >
              <Text
                style={[
                  styles.restChipText,
                  restDuration === sec && styles.restChipTextActive,
                ]}
              >
                {sec}s
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* HỘP ĐANG NGHỈ */}
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

      {/* TIẾN ĐỘ DẠNG THANH */}
      <View style={styles.progressBox}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            Tiến độ: {completedCount}/{activeTotal || 0} bài · {percent}%
          </Text>
          {skippedCount > 0 && (
            <Text style={styles.skipInfoText}>Bỏ qua {skippedCount} bài</Text>
          )}
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[styles.progressBarFill, { width: `${percent}%` }]}
          />
        </View>
      </View>

      {/* DANH SÁCH BÀI TẬP */}
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
              skipped[index] && styles.exerciseCardSkipped,
            ]}
          >
            {/* CHECKBOX */}
            <TouchableOpacity
              style={styles.checkBtn}
              onPress={() => toggleComplete(index)}
            >
              <Ionicons
                name={
                  progress[index] ? "checkbox-outline" : "square-outline"
                }
                size={26}
                color={
                  skipped[index]
                    ? "#555"
                    : progress[index]
                    ? "#00ffcc"
                    : "#666"
                }
              />
            </TouchableOpacity>

            {/* NỘI DUNG BÀI TẬP */}
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => openExerciseModal(index)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.exerciseName,
                  skipped[index] && { color: "#777", textDecorationLine: "line-through" },
                ]}
              >
                {item}
              </Text>

              <Text style={styles.exerciseMeta}>
                Set: {setCounts[index] || 0}
                {progress[index] && !skipped[index] ? " · Đã hoàn thành" : ""}
                {skipped[index] ? " · Đã bỏ qua" : ""}
              </Text>

              {notes[index] ? (
                <Text style={styles.exerciseNotePreview} numberOfLines={1}>
                  Note: {notes[index]}
                </Text>
              ) : null}
            </TouchableOpacity>

            {/* NÚT BÊN PHẢI */}
            <View style={styles.cardRightButtons}>
              <TouchableOpacity
                style={styles.setBtn}
                onPress={() => handleAddSet(index)}
              >
                <Text style={styles.setBtnText}>+ Set</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.noteBtn}
                onPress={() => openNoteModal(index)}
              >
                <Ionicons name="create-outline" size={18} color="#00ffcc" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.skipBtn,
                  skipped[index] && styles.skipBtnActive,
                ]}
                onPress={() => toggleSkip(index)}
              >
                <Text style={styles.skipBtnText}>
                  {skipped[index] ? "Unskip" : "Skip"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* NÚT KẾT THÚC */}
      <TouchableOpacity style={styles.finishBtn} onPress={openFinishSummary}>
        <Text style={styles.finishText}>Kết thúc buổi tập</Text>
      </TouchableOpacity>

      {/* COUNTDOWN OVERLAY */}
      {showCountdown && (
        <View style={styles.countdownOverlay}>
          <Text style={styles.countdownNumber}>{countdown}</Text>
          <Text style={styles.countdownText}>Chuẩn bị bắt đầu</Text>
        </View>
      )}

      {/* MODAL CHI TIẾT BÀI TẬP */}
      <Modal
        visible={exerciseModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExerciseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Chi tiết bài tập</Text>
            <Text style={styles.modalExerciseName}>
              {currentExerciseName}
            </Text>
            <Text style={styles.modalText}>
              • Giữ form chuẩn, không vặn lưng.{"\n"}
              • Hít vào khi hạ tạ, thở ra khi lên.{"\n"}
              • Tập trung vào nhóm cơ mục tiêu.{"\n"}
            </Text>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setExerciseModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Đã hiểu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL GHI CHÚ */}
      <Modal
        visible={noteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Ghi chú cho bài tập</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Ví dụ: Vai hơi mỏi, giảm tạ..."
              placeholderTextColor="#777"
              value={tempNote}
              onChangeText={setTempNote}
              multiline
            />
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => setNoteModalVisible(false)}
              >
                <Text style={styles.modalSecondaryText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={saveNote}
              >
                <Text style={styles.modalPrimaryText}>Lưu note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL TỔNG KẾT BUỔI TẬP */}
      <Modal
        visible={finishModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFinishModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Tổng kết buổi tập</Text>

            <View style={styles.summaryLine}>
              <Text style={styles.summaryLineLabel}>Thời gian:</Text>
              <Text style={styles.summaryLineValue}>
                {formatTime(elapsed)}
              </Text>
            </View>

            <View style={styles.summaryLine}>
              <Text style={styles.summaryLineLabel}>Calories ước tính:</Text>
              <Text style={styles.summaryLineValue}>
                {estimatedCalories} kcal
              </Text>
            </View>

            <View style={styles.summaryLine}>
              <Text style={styles.summaryLineLabel}>Bài hoàn thành:</Text>
              <Text style={styles.summaryLineValue}>
                {completedCount}/{activeTotal || 0} (Bỏ qua {skippedCount})
              </Text>
            </View>

            <View style={styles.summaryLine}>
              <Text style={styles.summaryLineLabel}>Tổng set:</Text>
              <Text style={styles.summaryLineValue}>{totalSets} set</Text>
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => setFinishModalVisible(false)}
              >
                <Text style={styles.modalSecondaryText}>Quay lại</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={confirmFinish}
              >
                <Text style={styles.modalPrimaryText}>Lưu & Kết thúc</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  // SUMMARY & CIRCLE
  summaryRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  circleWrapper: {
    width: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  circleOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#00ffcc44",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#020706",
  },
  circleInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#041512",
    justifyContent: "center",
    alignItems: "center",
  },
  circlePercent: {
    color: "#00ffcc",
    fontSize: 22,
    fontWeight: "800",
  },
  circleLabel: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 2,
  },
  summaryInfo: {
    flex: 1,
    justifyContent: "space-between",
    paddingLeft: 10,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryLabel: {
    color: "#aaa",
    fontSize: 12,
  },
  summaryValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
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

  restConfigRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  restConfigLabel: {
    color: "#ccc",
    fontSize: 13,
    fontWeight: "600",
  },
  restChipRow: {
    flexDirection: "row",
    gap: 6,
  },
  restChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#333",
    backgroundColor: "#111",
  },
  restChipActive: {
    borderColor: "#00ffcc",
    backgroundColor: "#02201b",
  },
  restChipText: {
    color: "#aaa",
    fontSize: 12,
  },
  restChipTextActive: {
    color: "#00ffcc",
    fontWeight: "700",
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
  skipInfoText: {
    color: "#777",
    fontSize: 12,
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
  exerciseCardSkipped: {
    borderColor: "#444",
    backgroundColor: "#080808",
  },
  checkBtn: {
    marginRight: 10,
  },
  exerciseName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  exerciseMeta: {
    marginTop: 2,
    color: "#aaa",
    fontSize: 12,
  },
  exerciseNotePreview: {
    marginTop: 2,
    color: "#00ffcc",
    fontSize: 11,
  },

  cardRightButtons: {
    marginLeft: 10,
    alignItems: "flex-end",
    gap: 4,
  },
  setBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#00ffcc",
  },
  setBtnText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "700",
  },
  noteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#00ffcc55",
    backgroundColor: "#031310",
  },
  skipBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#555",
  },
  skipBtnActive: {
    borderColor: "#ff5555",
    backgroundColor: "#220000",
  },
  skipBtnText: {
    color: "#ccc",
    fontSize: 11,
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

  // COUNTDOWN OVERLAY
  countdownOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  countdownNumber: {
    color: "#00ffcc",
    fontSize: 72,
    fontWeight: "900",
  },
  countdownText: {
    marginTop: 8,
    color: "#fff",
    fontSize: 18,
  },

  // MODAL CHUNG
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: "100%",
    borderRadius: 20,
    backgroundColor: "#111",
    padding: 18,
    borderWidth: 1,
    borderColor: "#00ffcc33",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalExerciseName: {
    color: "#00ffcc",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  modalText: {
    color: "#ccc",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  modalCloseBtn: {
    marginTop: 8,
    alignSelf: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#00ffcc",
  },
  modalCloseText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 13,
  },

  noteInput: {
    minHeight: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    padding: 10,
    color: "#fff",
    fontSize: 13,
    textAlignVertical: "top",
    marginBottom: 14,
    backgroundColor: "#000",
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  modalSecondaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#444",
  },
  modalSecondaryText: {
    color: "#ccc",
    fontSize: 13,
  },
  modalPrimaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#00ffcc",
  },
  modalPrimaryText: {
    color: "#000",
    fontSize: 13,
    fontWeight: "700",
  },

  summaryLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryLineLabel: {
    color: "#aaa",
    fontSize: 13,
  },
  summaryLineValue: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
