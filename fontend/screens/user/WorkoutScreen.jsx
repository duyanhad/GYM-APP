import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from "react-native";

export default function SetupWorkout({ navigation }) {
  const [name, setName] = useState("");
  const [exercises, setExercises] = useState([]);

  const addExercise = () => {
    if (!name.trim()) return alert("Nhập tên bài tập!");
    setExercises([...exercises, name]);
    setName("");
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Tạo bài tập cho hôm nay</Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Tên bài tập..."
        style={styles.input}
      />

      <TouchableOpacity style={styles.addBtn} onPress={addExercise}>
        <Text style={styles.addBtnText}>Thêm bài tập</Text>
      </TouchableOpacity>

      <Text style={styles.subTitle}>Danh sách bài tập</Text>

      {exercises.map((item, index) => (
        <View key={index} style={styles.item}>
          <Text style={styles.itemText}>• {item}</Text>
        </View>
      ))}

      <TouchableOpacity
        style={styles.saveBtn}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.saveText}>Lưu bài tập</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  addBtn: {
    backgroundColor: "#185f1bff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 25,
  },
  addBtnText: { color: "#fff", textAlign: "center", fontWeight: "700" },

  subTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  item: {
    backgroundColor: "#eafbea",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemText: { fontSize: 16 },

  saveBtn: {
    marginTop: 20,
    backgroundColor: "#2196F3",
    padding: 14,
    borderRadius: 12,
  },
  saveText: { color: "#fff", fontWeight: "700", textAlign: "center" },
});
