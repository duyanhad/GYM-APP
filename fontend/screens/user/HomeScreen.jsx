import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen({ navigation }) {
  // animation cho từng group
  const group1Anim = useRef(new Animated.Value(0)).current;
  const group2Anim = useRef(new Animated.Value(0)).current;
  const group3Anim = useRef(new Animated.Value(0)).current;
  const group4Anim = useRef(new Animated.Value(0)).current;

  // animation cho nút nổi
  const floatScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // fade + trượt lên lần lượt từng group
    Animated.stagger(120, [
      animateGroup(group1Anim),
      animateGroup(group2Anim),
      animateGroup(group3Anim),
      animateGroup(group4Anim),
    ]).start();

    // breathing effect cho nút nổi
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatScale, {
          toValue: 1.08,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(floatScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animateGroup = (anim) =>
    Animated.timing(anim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    });

  const onQuickWorkoutPress = () => {
    navigation.navigate("SetupWorkout");
  };

  const renderGroupWrapper = (anim, children) => {
    return (
      <Animated.View
        style={{
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            },
          ],
        }}
      >
        {children}
      </Animated.View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#050505" }}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.hello}>Xin chào, Gymer!</Text>
          <Text style={styles.motivation}>Never skip leg day 🦵🔥</Text>
        </View>

        <Image
          source={{ uri: "https://i.imgur.com/0y8Ftya.png" }}
          style={styles.avatar}
        />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* ===== GROUP 1: Tập luyện ===== */}
        {renderGroupWrapper(
          group1Anim,
          <View style={[styles.groupCard, styles.neonBorderGreen]}>
            <Text style={styles.groupTitle}>Tập luyện</Text>

            <View style={styles.iconGrid}>
              <TouchableOpacity
                style={[styles.iconBox, styles.glowGreen]}
                onPress={() => navigation.navigate("SetupWorkout")}
              >
                <Ionicons name="barbell-outline" size={28} color="#00ffcc" />
                <Text style={styles.iconLabel}>Tạo bài tập</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.iconBox, styles.glowGreen]}
                onPress={() => navigation.navigate("WorkoutList")}
              >
                <Ionicons name="list-outline" size={28} color="#00ffcc" />
                <Text style={styles.iconLabel}>Bài tập mẫu</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.iconBox, styles.glowGreen]}
                onPress={() => navigation.navigate("History")}
              >
                <Ionicons
                  name="checkmark-done-circle-outline"
                  size={28}
                  color="#00ffcc"
                />
                <Text style={styles.iconLabel}>Điểm danh</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ===== GROUP 2: Sức khỏe ===== */}
        {renderGroupWrapper(
          group2Anim,
          <View style={[styles.groupCard, styles.neonBorderBlue]}>
            <Text style={styles.groupTitle}>Theo dõi sức khỏe</Text>

            <View style={styles.iconGrid}>
              <TouchableOpacity style={[styles.iconBox, styles.glowBlue]}>
                <Ionicons name="fitness-outline" size={28} color="#36c3ff" />
                <Text style={styles.iconLabel}>BMI</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.iconBox, styles.glowBlue]}>
                <Ionicons name="body-outline" size={28} color="#36c3ff" />
                <Text style={styles.iconLabel}>Cơ thể</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.iconBox, styles.glowBlue]}>
                <Ionicons name="scale-outline" size={28} color="#36c3ff" />
                <Text style={styles.iconLabel}>Cân nặng</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ===== GROUP 3: Dinh dưỡng ===== */}
        {renderGroupWrapper(
          group3Anim,
          <View style={[styles.groupCard, styles.neonBorderOrange]}>
            <Text style={styles.groupTitle}>Dinh dưỡng</Text>

            <View style={styles.iconGrid}>
              <TouchableOpacity style={[styles.iconBox, styles.glowOrange]}>
                <Ionicons name="restaurant-outline" size={28} color="#ffb300" />
                <Text style={styles.iconLabel}>Kcal</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.iconBox, styles.glowOrange]}>
                <Ionicons name="nutrition-outline" size={28} color="#ffb300" />
                <Text style={styles.iconLabel}>Macros</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.iconBox, styles.glowOrange]}>
                <Ionicons name="water-outline" size={28} color="#ffb300" />
                <Text style={styles.iconLabel}>Nước</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ===== GROUP 4: Tiện ích GYM ===== */}
        {renderGroupWrapper(
          group4Anim,
          <View style={[styles.groupCard, styles.neonBorderRed]}>
            <Text style={styles.groupTitle}>Tiện ích GYM</Text>

            <View style={styles.iconGrid}>
              <TouchableOpacity style={[styles.iconBox, styles.glowRed]}>
                <Ionicons name="time-outline" size={28} color="#ff4d4d" />
                <Text style={styles.iconLabel}>Timer</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.iconBox, styles.glowRed]}>
                <Ionicons name="camera-outline" size={28} color="#ff4d4d" />
                <Text style={styles.iconLabel}>Check-in</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.iconBox, styles.glowRed]}>
                <Ionicons name="stats-chart-outline" size={28} color="#ff4d4d" />
                <Text style={styles.iconLabel}>Biểu đồ</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* FLOATING BUTTON QUICK WORKOUT */}
      <Animated.View
        style={[
          styles.floatingWrapper,
          {
            transform: [{ scale: floatScale }],
          },
        ]}
      >
        <TouchableOpacity style={styles.floatingBtn} onPress={onQuickWorkoutPress}>
          <Ionicons name="flash-outline" size={30} color="#000" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
    alignItems: "center",
  },
  hello: { fontSize: 24, fontWeight: "700", color: "#fff" },
  motivation: { color: "#00ffcc", fontSize: 14, marginTop: 4 },
  avatar: { width: 50, height: 50, borderRadius: 30, backgroundColor: "#111" },

  groupCard: {
    backgroundColor: "rgba(8,8,8,0.9)",
    padding: 16,
    borderRadius: 22,
    marginBottom: 22,
  },
  groupTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  iconBox: {
    width: "30%",
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 14,
    backgroundColor: "rgba(20,20,20,0.95)",
  },
  iconLabel: {
    marginTop: 6,
    color: "#eee",
    fontSize: 12,
    textAlign: "center",
  },

  // neon border cho group
  neonBorderGreen: {
    borderWidth: 1,
    borderColor: "rgba(0,255,204,0.4)",
    shadowColor: "#00ffcc",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  neonBorderBlue: {
    borderWidth: 1,
    borderColor: "rgba(54,195,255,0.4)",
    shadowColor: "#36c3ff",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  neonBorderOrange: {
    borderWidth: 1,
    borderColor: "rgba(255,179,0,0.4)",
    shadowColor: "#ffb300",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  neonBorderRed: {
    borderWidth: 1,
    borderColor: "rgba(255,77,77,0.4)",
    shadowColor: "#ff4d4d",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },

  // glow cho icon
  glowGreen: {
    shadowColor: "#00ffcc",
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  glowBlue: {
    shadowColor: "#36c3ff",
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  glowOrange: {
    shadowColor: "#ffb300",
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  glowRed: {
    shadowColor: "#ff4d4d",
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },

  floatingWrapper: {
    position: "absolute",
    bottom: 30,
    right: 25,
  },
  floatingBtn: {
    backgroundColor: "#00ffcc",
    padding: 20,
    borderRadius: 50,
    elevation: 12,
    shadowColor: "#00ffcc",
    shadowOpacity: 0.8,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 },
  },
});
