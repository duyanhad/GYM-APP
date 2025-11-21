// frontend/screens/auth/authAnimations.js
import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

export const useAuthCardAnimation = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(70)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 120,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { fadeAnim, slideAnim, logoScale };
};

export const useShakeAnimation = () => {
  const value = useRef(new Animated.Value(0)).current;

  const runShake = () => {
    Animated.sequence([
      Animated.timing(value, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(value, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(value, { toValue: 4, duration: 50, useNativeDriver: true }),
      Animated.timing(value, { toValue: -4, duration: 50, useNativeDriver: true }),
      Animated.timing(value, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  return { value, runShake };
};

export const useButtonPressAnimation = () => {
  const buttonScale = useRef(new Animated.Value(1)).current;
  const neonGlow = useRef(new Animated.Value(0)).current;

  const pressIn = () => {
    Animated.parallel([
      Animated.spring(buttonScale, { toValue: 0.92, useNativeDriver: true }),
      Animated.timing(neonGlow, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const pressOut = () => {
    Animated.parallel([
      Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }),
      Animated.timing(neonGlow, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  return { buttonScale, neonGlow, pressIn, pressOut };
};

export const useCollapseCardAnimation = () => {
  const collapseAnim = useRef(new Animated.Value(0)).current;

  const collapseCard = () => {
    Animated.timing(collapseAnim, {
      toValue: 80,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(collapseAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  return { collapseAnim, collapseCard };
};
