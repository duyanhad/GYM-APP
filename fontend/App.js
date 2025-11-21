// App.js
import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Contexts
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { WorkoutProvider } from "./context/WorkoutContext";

// Navigation
import AuthStack from "./navigation/AuthStack";
import UserStack from "./navigation/UserStack";
import AdminStack from "./navigation/AdminStack";
import CoachStack from "./navigation/CoachStack";

function RootNavigator() {
  const { userToken, role } = React.useContext(AuthContext);

  if (!userToken) return <AuthStack />;

  if (role === "admin") return <AdminStack />;
  if (role === "coach") return <CoachStack />;

  return <UserStack />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        {/* Thêm WorkoutProvider ở đây để toàn app sử dụng được */}
        <WorkoutProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </WorkoutProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
