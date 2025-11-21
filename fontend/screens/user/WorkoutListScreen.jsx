import React from "react";
import { Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";

export default function WorkoutList({ navigation }) {
  const workouts = [
    "Chống đẩy",
    "Gập bụng",
    "Squat",
    "Plank",
    "Nâng tạ",
    "Cơ bụng 6 phút",
    "Chạy bộ 15 phút",
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Danh sách bài tập mẫu</Text>

      {workouts.map((item, index) => (
        <TouchableOpacity key={index} style={styles.item}>
          <Text style={styles.itemText}>• {item}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 20 },
  item: {
    backgroundColor: "#fff",
    elevation: 2,
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  itemText: { fontSize: 18, fontWeight: "600" },
});
