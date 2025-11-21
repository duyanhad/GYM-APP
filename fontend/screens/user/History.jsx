import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

import { WorkoutContext } from "../../context/WorkoutContext";
import { AuthContext } from "../../context/AuthContext";

const API_BASE_URL = "http://192.168.0.103:4000";
const screenWidth = Dimensions.get("window").width;

export default function History() {
  const { activeSession, startSession, resetSession } =
    useContext(WorkoutContext);
  const { userToken } = useContext(AuthContext);

  const [checkinData, setCheckinData] = useState({});
  const [selectedSessions, setSelectedSessions] = useState([]); // nhiều lịch sử trong ngày
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const isTraining = activeSession?.isTraining;
  const startTimeISO = activeSession?.startTime;

  const formatDate = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  const formatISO = (iso) => formatDate(new Date(iso));

  // 🔄 Load lịch sử từ server, group theo ngày
  useEffect(() => {
    if (!userToken) return;
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/sessions`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });

        const sessions = res.data || [];
        const grouped = {};

        sessions.forEach((s) => {
          const dateStr = formatISO(s.date);
          if (!grouped[dateStr]) {
            grouped[dateStr] = {
              marked: true,
              dotColor: "#00e6b8",
              sessions: [],
            };
          }
          grouped[dateStr].sessions.push({
            _id: s._id,
            duration: s.duration,
            calories: s.calories,
            exercises: s.exercises || [],
            note: s.note || "",
          });
        });

        setCheckinData(grouped);
      } catch (err) {
        console.log("Load sessions error:", err.message);
      }
    };
    load();
  }, [userToken]);

  // ⭐ HANDLE START — Popup hỏi Reset/Xoá hay Tiếp tục
  const handleStart = () => {
    const demo = ["Squat 4x10", "Bench Press 4x8", "Deadlift 3x5", "Plank 60s"];
    const todayStr = formatDate(new Date());
    const hasTodayData =
      checkinData[todayStr] && checkinData[todayStr].sessions?.length > 0;

    if (hasTodayData) {
      Alert.alert(
        "Tiếp tục hay bắt đầu mới?",
        "Bạn muốn cộng dồn vào buổi tập trước hay reset (xoá hết lịch sử ngày hôm nay) để bắt đầu lại?",
        [
          {
            text: "Tiếp tục (cộng dồn)",
            onPress: () => {
              // không xoá backend, chỉ bắt đầu thêm 1 session mới
              resetSession();
              startSession(demo);
              Alert.alert("🏋️ Bắt đầu buổi tập mới (cộng dồn)!");
            },
          },
          {
            text: "Reset (bắt đầu mới)",
            style: "destructive",
            onPress: async () => {
              try {
                if (userToken) {
                  await axios.delete(
                    `${API_BASE_URL}/api/sessions/by-date/${todayStr}`,
                    {
                      headers: { Authorization: `Bearer ${userToken}` },
                    }
                  );
                }
                // Xoá local ngày hôm nay
                setCheckinData((prev) => {
                  const copy = { ...prev };
                  delete copy[todayStr];
                  return copy;
                });
                if (selectedDay === todayStr) {
                  setSelectedSessions([]);
                  setSelectedDay(null);
                  setSelectedIndex(0);
                }
              } catch (err) {
                console.log("Delete sessions error:", err.message);
                Alert.alert("Lỗi", "Không xoá được lịch sử trên server.");
              } finally {
                resetSession();
                startSession(demo);
                Alert.alert("🏋️ Bắt đầu buổi tập mới!");
              }
            },
          },
          { text: "Hủy", style: "cancel" },
        ]
      );
      return;
    }

    // Lần đầu trong ngày, chưa có lịch sử
    resetSession();
    startSession(demo);
    Alert.alert("🏋️ Bắt đầu buổi tập!");
  };

  // ⏹ KẾT THÚC BUỔI TẬP → lưu thêm một session cho ngày hiện tại
  const handleEnd = async () => {
    if (!isTraining || !startTimeISO) return;

    const start = new Date(startTimeISO);
    const end = new Date();

    const diffMinutes = Math.max(Math.round((end - start) / 60000), 1);
    const calories = diffMinutes * 8;
    const today = formatDate(end);

    const detail = {
      duration: diffMinutes,
      calories,
      exercises:
        Array.isArray(activeSession.exercises) && activeSession.exercises.length
          ? activeSession.exercises
          : ["Chưa có danh sách bài tập (demo)."],
      note: "Buổi tập được ghi vào lịch khi bạn bấm kết thúc.",
    };

    try {
      let savedSession = null;

      if (userToken) {
        const res = await axios.post(
          `${API_BASE_URL}/api/sessions`,
          {
            date: today,
            duration: detail.duration,
            calories: detail.calories,
            exercises: detail.exercises,
            note: detail.note,
          },
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        savedSession = res.data;
      }

      const sessionObj = savedSession
        ? {
            _id: savedSession._id,
            duration: savedSession.duration,
            calories: savedSession.calories,
            exercises: savedSession.exercises || [],
            note: savedSession.note || "",
          }
        : {
            _id: Math.random().toString(36),
            ...detail,
          };

      // Cập nhật calendar local: append vào ngày hôm nay
      setCheckinData((prev) => {
        const prevDay = prev[today];
        if (prevDay && Array.isArray(prevDay.sessions)) {
          return {
            ...prev,
            [today]: {
              ...prevDay,
              sessions: [...prevDay.sessions, sessionObj],
            },
          };
        }
        return {
          ...prev,
          [today]: {
            marked: true,
            dotColor: "#00e6b8",
            sessions: [sessionObj],
          },
        };
      });

      // Nếu đang xem đúng ngày hôm nay thì cũng append
      setSelectedSessions((prev) => {
        if (selectedDay === today) {
          return [...prev, sessionObj];
        }
        return prev;
      });

      resetSession();

      Alert.alert(
        "🎉 Hoàn thành buổi tập!",
        `Bạn tập ${diffMinutes} phút, đốt ${calories} kcal`
      );
    } catch (err) {
      console.log("Create session error:", err.message);
      Alert.alert("Lỗi", "Không thể lưu buổi tập lên server.");
      resetSession();
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#050505" }}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Lịch điểm danh 🗓️</Text>

        {!isTraining ? (
          <TouchableOpacity style={styles.neonStartBtn} onPress={handleStart}>
            <Ionicons name="flash-outline" size={24} color="#000" />
            <Text style={styles.startText}>Bắt đầu buổi tập</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.neonEndBtn} onPress={handleEnd}>
            <Ionicons name="stop-circle-outline" size={24} color="#fff" />
            <Text style={styles.endText}>Kết thúc buổi tập</Text>
          </TouchableOpacity>
        )}

        {/* Calendar */}
        <View style={styles.calendarShadow}>
          <View style={styles.calendarWrapper}>
            <Calendar
              theme={{
                calendarBackground: "#0d0d0d",
                dayTextColor: "#fff",
                monthTextColor: "#00e6b8",
                arrowColor: "#00e6b8",
                todayTextColor: "#ff4d4d",
                textDisabledColor: "#444",
              }}
              markedDates={checkinData}
              onDayPress={(d) => {
                const data = checkinData[d.dateString];
                if (data?.sessions?.length) {
                  setSelectedDay(d.dateString);
                  setSelectedSessions(data.sessions);
                  setSelectedIndex(0);
                } else {
                  setSelectedDay(d.dateString);
                  setSelectedSessions([]);
                  setSelectedIndex(0);
                }
              }}
            />
          </View>
        </View>

        {/* Chi tiết — vuốt ngang giữa các session trong ngày */}
        {selectedSessions.length > 0 && (
          <View style={styles.detailWrapperShadow}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(
                  e.nativeEvent.contentOffset.x /
                    e.nativeEvent.layoutMeasurement.width
                );
                setSelectedIndex(idx);
              }}
            >
              {selectedSessions.map((s, idx) => (
                <View
                  key={s._id || idx}
                  style={[styles.detailBox, { width: screenWidth - 40 }]}
                >
                  <Text style={styles.detailTitle}>
                    Chi tiết buổi tập #{idx + 1}
                  </Text>

                  <Text style={styles.detailLine}>
                    ⏱ Thời gian: {s.duration} phút
                  </Text>
                  <Text style={styles.detailLine}>
                    🔥 Calories: {s.calories} kcal
                  </Text>

                  <Text style={styles.detailSub}>🏋 Bài tập:</Text>
                  {s.exercises.map((ex, i) => (
                    <Text key={i} style={styles.exerciseItem}>
                      • {ex}
                    </Text>
                  ))}

                  <Text style={styles.note}>💬 {s.note}</Text>

                  <TouchableOpacity
                    style={styles.closeBtnRed}
                    onPress={() => setSelectedSessions([])}
                  >
                    <Ionicons name="close" size={26} color="#ff4d4d" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            {/* chấm nhỏ thể hiện index */}
            <View style={styles.pagination}>
              {selectedSessions.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    idx === selectedIndex && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { color: "#fff", fontSize: 28, fontWeight: "700", marginBottom: 20 },

  neonStartBtn: {
    flexDirection: "row",
    backgroundColor: "#00e6b8",
    borderRadius: 14,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  startText: { marginLeft: 12, fontWeight: "700", color: "#000", fontSize: 17 },

  neonEndBtn: {
    flexDirection: "row",
    backgroundColor: "#ff4d4d",
    borderRadius: 14,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  endText: { marginLeft: 12, fontWeight: "700", color: "#fff", fontSize: 17 },

  calendarShadow: {
    shadowColor: "#00e6b8",
    shadowOpacity: 0.3,
    shadowRadius: 18,
    borderRadius: 18,
    marginBottom: 25,
  },
  calendarWrapper: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#00e6b8",
    padding: 2,
  },

  detailWrapperShadow: {
    shadowColor: "#00e6b8",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    borderRadius: 18,
    marginBottom: 20,
  },
  detailBox: {
    backgroundColor: "#0d0d0d",
    padding: 16,
    borderRadius: 18,
    borderColor: "#00e6b8",
    borderWidth: 1,
    marginRight: 10,
  },

  closeBtnRed: {
    alignSelf: "center",
    marginTop: 20,
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#ff4d4d",
    shadowColor: "#ff4d4d",
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },

  detailTitle: { color: "#00e6b8", fontSize: 22, fontWeight: "700" },
  detailLine: { color: "#fff", fontSize: 16, marginTop: 8 },
  detailSub: { color: "#fff", fontSize: 17, marginTop: 12, fontWeight: "600" },
  exerciseItem: { color: "#ccc", marginLeft: 10, marginTop: 4 },
  note: { color: "#ffcc66", marginTop: 12, fontStyle: "italic" },

  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: "#555",
  },
  dotActive: {
    backgroundColor: "#00e6b8",
  },
});
