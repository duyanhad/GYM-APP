// frontend/screens/coach/WorkoutScreen.jsx

import React, {
  useState,
  useContext,
  useMemo,
  useRef,
  useEffect,
} from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  Image,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { WorkoutContext } from "../../context/WorkoutContext";
import { AuthContext } from "../../context/AuthContext";

// ======================================================
// 🔧 CẤU HÌNH (sử dụng cho backend – có thể chỉnh lại sau)
// ======================================================
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://192.168.0.103:4000";
const PRESET_STORAGE_KEY = "GYM_APP_WORKOUT_PRESETS";

// ======================================================
// ⭐ NHÓM CƠ + ICON CHUẨN GYM (ĐÃ THÊM NGỰC + CARDIO)
// ======================================================

const MUSCLE_GROUPS = [
  { key: "legs", label: "Chân", image: require("../../assets/legs.png") },
  {
    key: "biceps",
    label: "Tay trước",
    image: require("../../assets/biceps.png"),
  },
  {
    key: "triceps",
    label: "Tay sau",
    image: require("../../assets/triceps.png"),
  },
  {
    key: "shoulders",
    label: "Vai",
    image: require("../../assets/shoulders.png"),
  },
  { key: "back", label: "Lưng", image: require("../../assets/back.png") },
  { key: "waist", label: "Eo", image: require("../../assets/waist.png") },
  { key: "abs", label: "Bụng", image: require("../../assets/abs.png") },
  { key: "chest", label: "Ngực", image: require("../../assets/chest.png") },
  { key: "cardio", label: "Cardio", image: require("../../assets/logo.png") },
];

export default function WorkoutScreen({ navigation }) {
  const { startSession } = useContext(WorkoutContext);
  const { userToken } = useContext(AuthContext);

  // ======================================================
  // 🧠 STATE CHÍNH: BÀI TẬP THEO TỪNG NHÓM CƠ
  // ======================================================
  const [exercises, setExercises] = useState({
    legs: [],
    biceps: [],
    triceps: [],
    shoulders: [],
    back: [],
    waist: [],
    abs: [],
    chest: [],
    cardio: [],
  });

  // ======================================================
  // 🧠 STATE POPUP THÊM BÀI
  // ======================================================
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newReps, setNewReps] = useState("");
  const [newSets, setNewSets] = useState("");

  // ⭐ DANH SÁCH GỢI Ý LẤY TỪ DB
  const [suggestedFromDB, setSuggestedFromDB] = useState([]);

  // Animation popup thêm bài
  const popupOpacity = useRef(new Animated.Value(0)).current;
  const popupScale = useRef(new Animated.Value(0.9)).current;

  // ======================================================
  // 🧠 STATE ROUTINE / PRESET
  // ======================================================
  const [presets, setPresets] = useState([]); // danh sách routine đã lưu
  const [presetName, setPresetName] = useState(""); // tên routine mới / đang sửa
  const [editingPresetId, setEditingPresetId] = useState(null); // id routine đang chỉnh sửa

  // ======================================================
  // 🧠 STATE CHO CRUD (MENU + POPUP SỬA BÀI)
  // ======================================================
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuGroup, setMenuGroup] = useState(null);
  const [menuIndex, setMenuIndex] = useState(null);

  const [editGroup, setEditGroup] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [editName, setEditName] = useState("");
  const [editReps, setEditReps] = useState("");
  const [editSets, setEditSets] = useState("");

  // ======================================================
  // 🔁 LOAD ROUTINE TỪ LOCAL + BACKEND
  // ======================================================
  useEffect(() => {
    (async () => {
      // 1. Load từ AsyncStorage
      try {
        const raw = await AsyncStorage.getItem(PRESET_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setPresets(parsed);
          }
        }
      } catch (e) {
        console.log("Không thể load preset từ local:", e?.message);
      }

      // 2. Thử sync từ backend (nếu có API)
      try {
        const res = await fetch(`${API_BASE_URL}/api/workout-presets`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setPresets(data);
            await AsyncStorage.setItem(
              PRESET_STORAGE_KEY,
              JSON.stringify(data)
            );
          }
        }
      } catch (e) {
        // Nếu backend chưa có hoặc lỗi → bỏ qua, vẫn dùng local
        console.log("Không thể sync preset từ backend (bỏ qua):", e?.message);
      }
    })();
  }, []);

  // ======================================================
  // ⚙️ HÀM LƯU ROUTINE XUỐNG LOCAL + THỬ GỬI BACKEND
  // ======================================================
  const savePresetsEverywhere = async (updatedList) => {
    // Lưu local
    try {
      await AsyncStorage.setItem(
        PRESET_STORAGE_KEY,
        JSON.stringify(updatedList)
      );
    } catch (e) {
      console.log("Lỗi lưu preset local:", e?.message);
    }

    // Gửi backend (nếu API đã triển khai)
    try {
      await fetch(`${API_BASE_URL}/api/workout-presets/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedList),
      });
    } catch (e) {
      console.log("Gửi preset lên backend thất bại (bỏ qua):", e?.message);
    }
  };

  // ======================================================
  // 🎯 MỞ / ĐÓNG POPUP THÊM BÀI
  // ======================================================
  const openPopup = async (group) => {
    setSelectedGroup(group);

    // reset input khi mở popup
    setNewName("");
    setNewReps("");
    setNewSets("");
    setSearch("");

    popupOpacity.setValue(0);
    popupScale.setValue(0.85);

    // ⭐ LẤY DANH SÁCH BÀI TẬP TỪ DB THEO NHÓM CƠ
    try {
     console.log("🔍 Token gửi lên:", userToken);
console.log("🔍 URL:", `${API_BASE_URL}/api/exercises?muscleGroup=${group.key}`);

const res = await fetch(
  `${API_BASE_URL}/api/exercises?muscleGroup=${group.key}`,
  {
    headers: {
      Authorization: `Bearer ${userToken}`,
      "Content-Type": "application/json",
    },
  }
);

      if (res.ok) {
        const data = await res.json();
        setSuggestedFromDB(Array.isArray(data) ? data : []);
      } else {
        setSuggestedFromDB([]);
      }
    } catch (err) {
      console.log("❌ Lỗi load bài tập từ DB:", err);
      setSuggestedFromDB([]);
    }

    Animated.parallel([
      Animated.timing(popupOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(popupScale, {
        toValue: 1,
        friction: 7,
        tension: 70,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closePopup = () => {
    Animated.parallel([
      Animated.timing(popupOpacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(popupScale, {
        toValue: 0.85,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSelectedGroup(null);
      setNewName("");
      setNewReps("");
      setNewSets("");
      setSearch("");
      setSuggestedFromDB([]);
    });
  };

  // ======================================================
  // 🔎 FILTER GỢI Ý BÀI TẬP THEO SEARCH (LẤY TỪ DB)
  // ======================================================
 const FILTERED = useMemo(() => {

  const base = suggestedFromDB.map((i) => i.name);   // ⭐ GHÉP THÊM DÒNG NÀY

  if (!search.trim()) return base;

  return base.filter((item) =>
    item.toLowerCase().includes(search.toLowerCase())
  );
}, [search, suggestedFromDB]);

  // ======================================================
  // ➕ THÊM BÀI TẬP CHO 1 NHÓM CƠ
  // ======================================================
  const addExercise = () => {
    if (!selectedGroup) return;
    if (!newName.trim()) return;

    setExercises((prev) => ({
      ...prev,
      [selectedGroup.key]: [
        ...prev[selectedGroup.key],
        {
          name: newName.trim(),
          reps: newReps || "0",
          sets: newSets || "0",
        },
      ],
    }));

    // Giữ popup mở để có thể thêm nhiều bài liên tục
    setNewName("");
    setNewReps("");
    setNewSets("");
    setSearch("");
  };

  // ======================================================
  // ✅ LỌC NHỮM CƠ ĐÃ CÓ BÀI (ĐỂ HIỂN THỊ DƯỚI)
  // ======================================================
  const nonEmptyGroups = useMemo(
    () =>
      MUSCLE_GROUPS.filter(
        (g) => Array.isArray(exercises[g.key]) && exercises[g.key].length > 0
      ),
    [exercises]
  );

  const hasAnyExercise = nonEmptyGroups.length > 0;

  // ======================================================
  // 🧩 TẠO / CẬP NHẬT ROUTINE TỪ BÀI TẬP HIỆN TẠI
  // ======================================================
  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    if (!hasAnyExercise) return; // không có bài thì khỏi lưu

    // Nếu đang ở chế độ sửa → cập nhật routine hiện tại
    if (editingPresetId) {
      const updatedPresets = presets.map((p) =>
        p.id === editingPresetId
          ? { ...p, name: presetName.trim(), exercises }
          : p
      );
      setPresets(updatedPresets);
      setEditingPresetId(null);
      setPresetName("");
      await savePresetsEverywhere(updatedPresets);
      return;
    }

    // Chế độ tạo mới
    const newPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      exercises,
    };

    const updated = [...presets, newPreset];
    setPresets(updated);
    setPresetName("");

    await savePresetsEverywhere(updated);
  };

  const cancelEditPreset = () => {
    setEditingPresetId(null);
    setPresetName("");
  };

  // ======================================================
  // 🧩 ÁP DỤNG ROUTINE ĐÃ LƯU → ĐỔ VÀO exercises
  // ======================================================
  const applyPreset = (preset) => {
    if (!preset || !preset.exercises) return;
    setExercises({
      // đảm bảo đủ key kể cả preset cũ không có
      legs: preset.exercises.legs || [],
      biceps: preset.exercises.biceps || [],
      triceps: preset.exercises.triceps || [],
      shoulders: preset.exercises.shoulders || [],
      back: preset.exercises.back || [],
      waist: preset.exercises.waist || [],
      abs: preset.exercises.abs || [],
      chest: preset.exercises.chest || [],
      cardio: preset.exercises.cardio || [],
    });
  };

  // Bắt đầu chỉnh sửa 1 routine:
  const startEditPreset = (preset) => {
    setEditingPresetId(preset.id);
    setPresetName(preset.name);
    // Đổ bài tập của routine xuống form hiện tại để user chỉnh tiếp
    applyPreset(preset);
  };

  // ======================================================
  // 🗑 XOÁ ROUTINE (chỉ local + backend bulk)
  // ======================================================
  const deletePreset = async (id) => {
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);

    // Nếu đang sửa routine vừa bị xoá → reset
    if (editingPresetId === id) {
      setEditingPresetId(null);
      setPresetName("");
    }

    await savePresetsEverywhere(updated);
  };

  // ======================================================
  // 🔁 BẮT ĐẦU BUỔI TẬP → GỬI VÀO CONTEXT (LIÊN KẾT ĐIỂM DANH)
  // ======================================================
  const handleStartTraining = () => {
    const combined = [];

    for (const g in exercises) {
      exercises[g].forEach((item) => {
        combined.push(`${item.name} – ${item.sets} x ${item.reps} (${g})`);
      });
    }

    // 1. Lưu session
    startSession(combined);

    // 2. CHUYỂN HƯỚNG
    navigation.navigate("WorkoutSession");
  };

  // ======================================================
  // 🧩 CRUD: MENU NHỎ + POPUP SỬA BÀI
  // ======================================================
  const openExerciseMenu = (groupKey, index) => {
    setMenuGroup(groupKey);
    setMenuIndex(index);
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuGroup(null);
    setMenuIndex(null);
    setMenuVisible(false);
  };

  const openEditFromMenu = () => {
    if (menuGroup == null || menuIndex == null) return;
    const ex = exercises[menuGroup][menuIndex];
    setEditGroup(menuGroup);
    setEditIndex(menuIndex);
    setEditName(ex.name);
    setEditReps(String(ex.reps));
    setEditSets(String(ex.sets));
    closeMenu();
  };

  const deleteExerciseFromMenu = () => {
    if (menuGroup == null || menuIndex == null) return;
    setExercises((prev) => {
      const updated = { ...prev };
      updated[menuGroup] = [...updated[menuGroup]];
      updated[menuGroup].splice(menuIndex, 1);
      return updated;
    });
    closeMenu();
  };

  const closeEditPopup = () => {
    setEditGroup(null);
    setEditIndex(null);
    setEditName("");
    setEditReps("");
    setEditSets("");
  };

  const saveEdit = () => {
    if (!editGroup && editGroup !== 0) return;
    setExercises((prev) => {
      const updated = { ...prev };
      updated[editGroup] = [...updated[editGroup]];
      updated[editGroup][editIndex] = {
        name: editName.trim(),
        reps: editReps,
        sets: editSets,
      };
      return updated;
    });
    closeEditPopup();
  };

  return (
    <>
      {/* ============================================================
          🖼 MÀN HÌNH CHÍNH — NHÓM CƠ + ROUTINE + DANH SÁCH BÀI
      ============================================================ */}
      <ScrollView
        style={{ flex: 1, backgroundColor: "#050505" }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Tạo bài tập 💪</Text>

          {/* 🟩 GRID NHÓM CƠ (KHUNG VUÔNG NEON) */}
          <View style={styles.grid}>
            {MUSCLE_GROUPS.map((group) => (
              <TouchableOpacity
                key={group.key}
                style={styles.neonBox}
                onPress={() => openPopup(group)}
              >
                <Image
                  source={group.image}
                  style={{
                    width: 38,
                    height: 38,
                    marginBottom: 6,
                  }}
                  resizeMode="contain"
                />
                <Text style={styles.neonBoxText}>{group.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 🟦 VÙNG ROUTINE ĐÃ LƯU */}
          <View style={styles.presetSection}>
            <Text style={styles.presetTitle}>Routine đã lưu</Text>

            {/* Ô nhập tên routine mới + nút Lưu */}
            <View style={styles.presetRow}>
              <TextInput
                placeholder="Tên routine (VD: Push Day, Leg Day...)"
                placeholderTextColor="#666"
                style={styles.presetInput}
                value={presetName}
                onChangeText={setPresetName}
              />
              <TouchableOpacity
                style={[
                  styles.presetSaveBtn,
                  (!presetName.trim() || !hasAnyExercise) && {
                    opacity: 0.5,
                  },
                ]}
                onPress={handleSavePreset}
                disabled={!presetName.trim() || !hasAnyExercise}
              >
                <Ionicons name="save-outline" size={20} color="#000" />
              </TouchableOpacity>

              {editingPresetId && (
                <TouchableOpacity
                  style={styles.presetCancelBtn}
                  onPress={cancelEditPreset}
                >
                  <Text style={styles.presetCancelText}>Hủy sửa</Text>
                </TouchableOpacity>
              )}
            </View>

            {editingPresetId && (
              <Text style={styles.presetEditingHint}>
                Đang chỉnh routine{" "}
                <Text style={{ color: "#00e6b8", fontWeight: "700" }}>
                  {presetName}
                </Text>
                . Hãy chỉnh bài tập phía dưới rồi bấm lại nút Lưu để cập nhật.
              </Text>
            )}

            {presets.length === 0 ? (
              <Text style={styles.presetEmpty}>
                Chưa có routine. Tạo bài tập phía trên rồi đặt tên & lưu lại.
              </Text>
            ) : (
              presets.map((p) => (
                <View key={p.id} style={styles.presetItem}>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => applyPreset(p)}
                  >
                    <Text style={styles.presetName}>{p.name}</Text>
                    <Text style={styles.presetSub}>
                      {Object.values(p.exercises || {}).reduce(
                        (sum, arr) =>
                          sum + (Array.isArray(arr) ? arr.length : 0),
                        0
                      )}{" "}
                      bài tập
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.presetActions}>
                    <TouchableOpacity
                      style={styles.presetIconBtn}
                      onPress={() => startEditPreset(p)}
                    >
                      <Ionicons
                        name="create-outline"
                        size={20}
                        color="#00e6b8"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.presetIconBtn}
                      onPress={() => deletePreset(p.id)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={22}
                        color="#ff6666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* 🟧 DANH SÁCH BÀI TẬP ĐÃ CHỌN THEO NHÓM CƠ
              → ẨN HOÀN TOÀN NẾU CHƯA CÓ BÀI NÀO */}
          {hasAnyExercise ? (
            nonEmptyGroups.map((group) => (
              <View style={styles.groupSection} key={group.key}>
                <Text style={styles.groupTitle}>{group.label}</Text>

                {exercises[group.key].map((ex, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.exerciseCard}
                    onPress={() => openExerciseMenu(group.key, idx)}
                  >
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                    <Text style={styles.exerciseSub}>
                      {ex.sets} x {ex.reps} reps
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          ) : (
            <Text style={styles.helperText}>
              Chưa có bài tập nào. Hãy bấm vào các khung nhóm cơ phía trên để
              thêm bài.
            </Text>
          )}

          {/* NÚT BẮT ĐẦU BUỔI TẬP */}
          <TouchableOpacity
            style={[styles.startBtn, !hasAnyExercise && { opacity: 0.5 }]}
            onPress={handleStartTraining}
            disabled={!hasAnyExercise}
          >
            <Text style={styles.startBtnText}>Bắt đầu buổi tập</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ============================================================
          🧩 POPUP THÊM BÀI — SEARCH + REPS + SETS
      ============================================================ */}
      {selectedGroup && (
        <View style={styles.popupOverlay}>
          <Animated.View
            style={[
              styles.popup,
              {
                opacity: popupOpacity,
                transform: [{ scale: popupScale }],
              },
            ]}
          >
            <Text style={styles.popupTitle}>
              Thêm bài cho {selectedGroup.label}
            </Text>

            {/* Thanh search */}
            <TextInput
              placeholder="Tìm hoặc nhập tên bài tập..."
              placeholderTextColor="#666"
              style={styles.searchInput}
              value={search}
              onChangeText={(t) => {
                setSearch(t);
                setNewName(t);
              }}
            />

            {/* Danh sách gợi ý từ DB */}
            <ScrollView style={{ maxHeight: 200 }}>
              {FILTERED.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.suggestItem,
                    newName === item && styles.suggestItemActive,
                  ]}
                  onPress={() => {
                    setNewName(item);
                    setSearch(item);
                  }}
                >
                  <Text
                    style={[
                      styles.suggestText,
                      newName === item && styles.suggestTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Reps + Sets */}
            <View style={styles.row}>
              <TextInput
                placeholder="Reps"
                keyboardType="numeric"
                placeholderTextColor="#666"
                style={styles.smallInput}
                value={newReps}
                onChangeText={setNewReps}
              />
              <TextInput
                placeholder="Sets"
                keyboardType="numeric"
                placeholderTextColor="#666"
                style={styles.smallInput}
                value={newSets}
                onChangeText={setNewSets}
              />
            </View>

            {/* Lưu */}
            <TouchableOpacity style={styles.saveBtn} onPress={addExercise}>
              <Text style={styles.saveBtnText}>Lưu</Text>
            </TouchableOpacity>

            {/* Đóng */}
            <TouchableOpacity style={{ marginTop: 10 }} onPress={closePopup}>
              <Text style={{ color: "#ccc", textAlign: "center" }}>Đóng</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {/* ============================================================
          🧩 MENU NHỎ CRUD (SỬA / XOÁ / HỦY)
      ============================================================ */}
      {menuVisible && (
        <View style={styles.popupOverlay}>
          <View style={styles.menuBox}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={openEditFromMenu}
            >
              <Text style={styles.menuButtonText}>Sửa bài tập</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuButton, styles.menuButtonDanger]}
              onPress={deleteExerciseFromMenu}
            >
              <Text style={[styles.menuButtonText, { color: "#ff6666" }]}>
                Xoá bài tập
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton} onPress={closeMenu}>
              <Text style={styles.menuButtonText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ============================================================
          🧩 POPUP CHỈNH SỬA BÀI TẬP
      ============================================================ */}
      {editGroup && (
        <View style={styles.popupOverlay}>
          <View style={styles.popup}>
            <Text style={styles.popupTitle}>Chỉnh sửa bài tập</Text>

            <TextInput
              placeholder="Tên bài tập"
              placeholderTextColor="#666"
              style={styles.searchInput}
              value={editName}
              onChangeText={setEditName}
            />

            <View style={styles.row}>
              <TextInput
                placeholder="Reps"
                keyboardType="numeric"
                placeholderTextColor="#666"
                style={styles.smallInput}
                value={editReps}
                onChangeText={setEditReps}
              />
              <TextInput
                placeholder="Sets"
                keyboardType="numeric"
                placeholderTextColor="#666"
                style={styles.smallInput}
                value={editSets}
                onChangeText={setEditSets}
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
              <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                marginTop: 10,
                padding: 12,
                borderRadius: 12,
                backgroundColor: "#222",
              }}
              onPress={closeEditPopup}
            >
              <Text style={{ color: "#ccc", textAlign: "center" }}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
}

/* ================================================================
   🎨 STYLE — APPLE FITNESS + NEON XANH + GHI CHÚ RÕ
================================================================ */
const styles = StyleSheet.create({
  container: { padding: 20 },

  title: {
    fontSize: 28,
    color: "#00e6b8",
    fontWeight: "800",
    marginBottom: 25,
  },

  // GRID nhóm cơ
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  neonBox: {
    width: "48%",
    height: 90,
    backgroundColor: "#0d0d0d",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(0, 255, 180, 0.7)",
    marginBottom: 15,
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#00ffcc",
    shadowOpacity: 0.55,
    shadowRadius: 15,
  },

  neonBoxText: {
    color: "#00ffcc",
    fontSize: 17,
    fontWeight: "700",
  },

  // Vùng Routine
  presetSection: {
    marginTop: 25,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#050505",
    borderWidth: 1,
    borderColor: "#00e6b822",
  },

  presetTitle: {
    color: "#00e6b8",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },

  presetRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  presetInput: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    marginRight: 8,
  },

  presetSaveBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#00e6b8",
    alignItems: "center",
    justifyContent: "center",
  },

  presetCancelBtn: {
    marginLeft: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#444",
  },

  presetCancelText: {
    color: "#ccc",
    fontSize: 12,
    fontWeight: "600",
  },

  presetEditingHint: {
    color: "#888",
    fontSize: 12,
    marginBottom: 6,
    fontStyle: "italic",
  },

  presetEmpty: {
    color: "#777",
    fontSize: 13,
    fontStyle: "italic",
  },

  presetItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 6,
  },

  presetName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  presetSub: {
    color: "#888",
    fontSize: 12,
  },

  presetActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },

  presetIconBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  // Danh sách bài theo nhóm
  groupSection: { marginTop: 25 },

  groupTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#00e6b8",
    marginBottom: 12,
  },

  exerciseCard: {
    backgroundColor: "#111",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#00e6b833",
  },

  exerciseName: { color: "#fff", fontSize: 17, fontWeight: "600" },
  exerciseSub: { color: "#aaa", marginTop: 4 },

  helperText: {
    marginTop: 20,
    color: "#777",
    fontStyle: "italic",
  },

  // Nút bắt đầu buổi tập
  startBtn: {
    backgroundColor: "#00e6b8",
    padding: 15,
    borderRadius: 16,
    marginTop: 35,
    alignItems: "center",
  },

  startBtnText: {
    color: "#000",
    fontSize: 17,
    fontWeight: "800",
  },

  // Popup overlay (dùng chung)
  popupOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },

  popup: {
    width: "90%",
    backgroundColor: "#0d0d0d",
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: "#00ffcc",

    shadowColor: "#00ffcc",
    shadowOpacity: 0.7,
    shadowRadius: 20,
  },

  popupTitle: {
    color: "#00ffcc",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 15,
  },

  searchInput: {
    backgroundColor: "#111",
    padding: 12,
    borderRadius: 12,
    color: "#fff",
    marginBottom: 12,
  },

  suggestItem: {
    paddingVertical: 9,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },

  suggestItemActive: {
    backgroundColor: "rgba(0,255,180,0.15)",
  },

  suggestText: { color: "#ccc", fontSize: 16 },

  suggestTextActive: { color: "#00ffcc", fontWeight: "700" },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  smallInput: {
    width: "48%",
    backgroundColor: "#111",
    padding: 12,
    borderRadius: 12,
    color: "#fff",
  },

  saveBtn: {
    backgroundColor: "#00ffcc",
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
  },

  saveBtnText: {
    textAlign: "center",
    color: "#000",
    fontWeight: "800",
    fontSize: 16,
  },

  // MENU NHỎ CRUD
  menuBox: {
    width: "80%",
    backgroundColor: "#111",
    borderRadius: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#00ffcc66",
  },

  menuButton: {
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },

  menuButtonDanger: {
    borderBottomColor: "#333",
  },

  menuButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
