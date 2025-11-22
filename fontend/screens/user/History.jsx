import React, {
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

import { WorkoutContext } from "../../context/WorkoutContext";
import { AuthContext } from "../../context/AuthContext";

const API_BASE_URL = "http://192.168.0.103:4000";
const screenWidth = Dimensions.get("window").width;

/* === Format date helpers === */
const formatDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const formatISO = (iso) => formatDate(new Date(iso));

export default function History() {
  const { activeSession, startSession, resetSession } =
    useContext(WorkoutContext);
  const { userToken } = useContext(AuthContext);

  const [checkinData, setCheckinData] = useState({});
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const isTraining = activeSession?.isTraining;
  const startTimeISO = activeSession?.startTime;

  /* ========== POPUP ANIMATION STATE ========== */
  const [showPopup, setShowPopup] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const openPopup = () => {
    setShowPopup(true);

    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closePopup = (callback) => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 130,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.5,
        duration: 130,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowPopup(false);
      if (callback) callback();
    });
  };

  /* ========== LOAD HISTORY ========== */
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
            exercises: s.details || [],
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

  /* ========== START SESSION BUTTON ========== */
  const handleStart = () => {
    const demo = ["Squat 4x10", "Bench Press 4x8", "Deadlift 3x5"];
    const todayStr = formatDate(new Date());
    const hasTodayData =
      checkinData[todayStr] && checkinData[todayStr].sessions?.length > 0;

    if (hasTodayData) {
      openPopup();
      return;
    }

    resetSession();
    startSession(demo);
    Alert.alert("Bắt đầu buổi tập!");
  };

  /* ========== END SESSION SAVE (mode cũ) ========== */
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
      note: "Buổi tập được lưu khi bạn bấm kết thúc.",
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
        : { _id: Math.random().toString(36), ...detail };

      setCheckinData((prev) => {
        const prevDay = prev[today];
        if (prevDay?.sessions) {
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

      if (selectedDay === today) {
        setSelectedSessions((prev) => [...prev, sessionObj]);
      }

      resetSession();

      Alert.alert(
        "🎉 Hoàn thành buổi tập!",
        `Bạn tập ${diffMinutes} phút, đốt ${calories} kcal`
      );
    } catch (err) {
      console.log("Create session error:", err.message);
      Alert.alert("Lỗi", "Không thể lưu buổi tập.");
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

        {/* ======== SESSION DETAIL ======== */}
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

                  {/* ---- HIỆN CHI TIẾT CHUẨN ---- */}
                  {s.exercises.map((ex, i) => (
                    <View key={i} style={{ marginBottom: 8 }}>
                      <Text style={styles.exerciseItem}>• {ex.name}</Text>

                      {ex.skipped ? (
                        <Text
                          style={{
                            color: "#ff5555",
                            marginLeft: 16,
                            marginTop: 2,
                          }}
                        >
                          (Đã bỏ qua)
                        </Text>
                      ) : (
                        <>
                          <Text
                            style={{
                              color: "#00e6b8",
                              marginLeft: 16,
                              marginTop: 2,
                            }}
                          >
                            Sets: {ex.sets}
                          </Text>
                          {ex.note ? (
                            <Text
                              style={{
                                color: "#ffcc66",
                                marginLeft: 16,
                                marginTop: 2,
                              }}
                            >
                            Note: {ex.note}
                          </Text>
                          ) : null}
                        </>
                      )}
                    </View>
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

      {/* ======== POPUP ======== */}
      {showPopup && (
        <Animated.View
          style={[styles.popupOverlay, { opacity: opacityAnim }]}
        >
          <Animated.View
            style={[
              styles.popupBox,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <Text style={styles.popupTitle}>Tiếp tục hay bắt đầu mới?</Text>

            {/* TIẾP TỤC */}
            <TouchableOpacity
              style={[styles.glowBtn, { backgroundColor: "#00e6b8" }]}
              onPress={() =>
                closePopup(() => {
                  resetSession();
                  startSession(["demo"]);
                })
              }
            >
              <Text style={styles.glowBtnDark}>Tiếp tục</Text>
            </TouchableOpacity>

            {/* RESET */}
            <TouchableOpacity
              style={[styles.glowBtn, { backgroundColor: "#ff4d4d" }]}
              onPress={() =>
                closePopup(async () => {
                  try {
                    const today = formatDate(new Date());

                    // ====== XÓA TRÊN BACKEND ======
                    await axios.delete(
                      `${API_BASE_URL}/api/sessions/by-date/${today}`,
                      { headers: { Authorization: `Bearer ${userToken}` } }
                    );

                    // ====== XÓA LOCAL ======
                    setCheckinData((prev) => {
                      const copy = { ...prev };
                      delete copy[today];
                      return copy;
                    });

                    // ====== RESET UI ======
                    if (selectedDay === today) {
                      setSelectedSessions([]);
                      setSelectedDay(null);
                      setSelectedIndex(0);
                    }

                    // ====== RESET STATE TẬP LUYỆN ======
                    resetSession();

                    Alert.alert("Đã reset!", "Hôm nay chưa tập luyện.");
                  } catch (err) {
                    console.log("DELETE ERROR:", err.message);
                    Alert.alert("Lỗi", "Không xoá được lịch hôm nay!");
                  }
                })
              }
            >
              <Text style={styles.glowBtnText}>Reset</Text>
            </TouchableOpacity>

            {/* HỦY */}
            <TouchableOpacity
              style={[styles.glowBtn, { backgroundColor: "#333" }]}
              onPress={() => closePopup()}
            >
              <Text style={styles.glowBtnText}>Hủy</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}
    </ScrollView>
  );
}

/* ========== STYLES ========== */
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
    marginHorizontal: 0,
    width: screenWidth - 40,
    alignSelf: "center",
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

  popupOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },

  popupBox: {
    width: "80%",
    padding: 22,
    borderRadius: 22,
    backgroundColor: "rgba(10,10,10,0.88)",
    borderWidth: 1,
    borderColor: "#00e6b8",
    shadowColor: "#00e6b8",
    shadowOpacity: 0.9,
    shadowRadius: 18,
    elevation: 10,
    alignItems: "center",
  },

  popupTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 18,
  },

  glowBtn: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#00e6b8",
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },

  glowBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  glowBtnDark: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },
});
