import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import HomeScreen from "../screens/user/HomeScreen";
import SetupWorkout from "../screens/user/WorkoutScreen";
import WorkoutList from "../screens/user/WorkoutListScreen";
import History from "../screens/user/History";

// ⭐ THÊM IMPORT NÀY
import WorkoutSessionScreen from "../screens/user/WorkoutSessionScreen";

const Stack = createStackNavigator();

export default function UserStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#326d56ff" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Trang chủ" }} />

      <Stack.Screen name="SetupWorkout" component={SetupWorkout} options={{ title: "Tạo bài tập" }} />

      <Stack.Screen name="WorkoutList" component={WorkoutList} options={{ title: "Danh sách bài tập mẫu" }} />

      <Stack.Screen name="History" component={History} options={{ title: "Lịch sử điểm danh" }} />

      {/* ⭐⭐ THÊM MÀN BUỔI TẬP Ở ĐÂY ⭐⭐ */}
      <Stack.Screen
        name="WorkoutSession"
        component={WorkoutSessionScreen}
        options={{ title: "Buổi tập" }}
      />
    </Stack.Navigator>
  );
}
