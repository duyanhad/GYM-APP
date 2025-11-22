// context/WorkoutContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "./AuthContext";

export const WorkoutContext = createContext();

const SESSION_KEY = "ACTIVE_WORKOUT_SESSION";

const defaultSession = {
  isTraining: false,
  startTime: null,
  exercises: [],
};

export const WorkoutProvider = ({ children }) => {
  const { userToken } = useContext(AuthContext);

  const [activeSession, setActiveSession] = useState(defaultSession);
  const [continueMode, setContinueMode] = useState(false);

  // ⭐ LƯU BUỔI TẬP VỪA KẾT THÚC (để cộng dồn)
  const [lastSession, setLastSession] = useState(null);

  // Load session đang chạy
  useEffect(() => {
    const loadSession = async () => {
      try {
        const json = await AsyncStorage.getItem(SESSION_KEY);
        if (json) {
          const parsed = JSON.parse(json);
          setActiveSession({ ...defaultSession, ...parsed });
        }
      } catch (e) {
        console.warn("Failed to load workout session", e);
      }
    };
    loadSession();
  }, []);

  // Lưu session
  useEffect(() => {
    const save = async () => {
      try {
        if (activeSession && activeSession.isTraining) {
          await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(activeSession));
        } else {
          await AsyncStorage.removeItem(SESSION_KEY);
        }
      } catch (e) {
        console.warn("Failed to save session", e);
      }
    };
    save();
  }, [activeSession]);

  // ⭐ BẮT ĐẦU / TIẾP TỤC BUỔI TẬP
  const startSession = (exercises = []) => {
    const now = new Date().toISOString();

    setActiveSession(prev => {
      // ➕ Nếu chọn cộng dồn
      if (continueMode && lastSession) {
        return {
          isTraining: true,
          startTime: lastSession.startTime,      // giữ thời gian cũ
          exercises: [...lastSession.exercises, ...exercises], // nối bài tập
        };
      }

      // ▶ Bắt đầu mới
      return {
        isTraining: true,
        startTime: now,
        exercises: exercises,
      };
    });
  };

  // ⭐ RESET BUỔI TẬP — nhưng lưu lại lastSession để popup biết
  const resetSession = () => {
    setLastSession(activeSession);  // lưu buổi tập cũ
    setActiveSession(defaultSession);
    setContinueMode(false);
  };

  return (
    <WorkoutContext.Provider
      value={{
        activeSession,
        startSession,
        resetSession,
        continueMode,
        setContinueMode,
        lastSession,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};
