import React, {
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Animated,
  Image,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";

import { AuthContext } from "../../context/AuthContext";
import { resendLoginOTPAPI } from "../../api/auth";

import { authStyles } from "./authStyles";
import {
  useAuthCardAnimation,
  useShakeAnimation,
  useButtonPressAnimation,
} from "./authAnimations";

const styles = authStyles;

export default function VerifyLoginOTPScreen({ route, navigation }) {
  const { email } = route.params;
  const { confirmLogin } = useContext(AuthContext);

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(60);

  // 👉 Sửa đúng: KHÔNG dùng refs
  const inputsRef = useRef([]);

  // Animation dùng chung
  const { fadeAnim, slideAnim } = useAuthCardAnimation();
  const { value: shakeAnim, runShake } = useShakeAnimation();
  const { buttonScale, neonGlow, pressIn, pressOut } =
    useButtonPressAnimation();

  // Countdown resend OTP
  useEffect(() => {
    if (seconds <= 0) return;

    const id = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    return () => clearInterval(id);
  }, [seconds]);

  // Xử lý nhập OTP từng ô
  const handleChangeDigit = (text, index) => {
    if (text && !/^[0-9]$/.test(text)) return;

    const newDigits = [...digits];
    newDigits[index] = text;
    setDigits(newDigits);

    // 👉 FIX lỗi refs: dùng inputsRef
    if (text && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
    if (!text && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  // Xác thực OTP
  const handleVerify = async () => {
    const code = digits.join("");

    if (code.length !== 6) {
      runShake();
      Alert.alert("Lỗi", "Vui lòng nhập đủ 6 số OTP.");
      return;
    }

    setLoading(true);
    try {
      await confirmLogin(email, code, navigation);
    } catch (error) {
      console.log("Login OTP error:", error);
      runShake();
      Alert.alert("Lỗi", "OTP không chính xác.");
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại mã OTP
  const handleResend = async () => {
    if (seconds > 0) return;

    try {
      await resendLoginOTPAPI(email);
      Alert.alert("Thông báo", "Đã gửi lại OTP!");
      setSeconds(60);
    } catch (error) {
      console.log(error);
      Alert.alert("Lỗi", "Không thể gửi lại OTP.");
    }
  };

  const otpFilledCount = digits.filter((d) => d !== "").length;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.root}>
        {/* CARD + ANIM */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Logo */}
          <View style={styles.logoWrapper}>
            <Image
              source={require("../../assets/logo.png")}
              style={styles.logo}
            />
          </View>

          <Text style={styles.title}>Xác thực đăng nhập</Text>
          <Text style={styles.subtitle}>
            OTP đã gửi tới <Text style={styles.bold}>{email}</Text>
          </Text>

          {/* OTP */}
          <Animated.View
            style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}
          >
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={(el) => (inputsRef.current[i] = el)}
                style={styles.otpInput}
                maxLength={1}
                keyboardType="number-pad"
                value={d}
                onChangeText={(t) => handleChangeDigit(t, i)}
              />
            ))}
          </Animated.View>

          {/* BUTTON */}
          <Pressable
            onPress={handleVerify}
            onPressIn={pressIn}
            onPressOut={pressOut}
            disabled={loading}
          >
            <Animated.View
              style={[
                styles.button,
                { transform: [{ scale: buttonScale }] },
                otpFilledCount < 4 && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.btnText}>
                {loading ? "Đang xác thực..." : "Xác nhận"}
              </Text>

              <Animated.View
                style={[styles.neonOverlay, { opacity: neonGlow }]}
              />
            </Animated.View>
          </Pressable>

          {/* RESEND OTP */}
          {seconds > 0 ? (
            <Text style={styles.resendText}>
              Gửi lại mã sau{" "}
              <Text style={styles.bold}>{seconds}s</Text>
            </Text>
          ) : (
            <Pressable onPress={handleResend}>
              <Text style={styles.resendLink}>Gửi lại OTP</Text>
            </Pressable>
          )}

          <Text
            style={styles.backText}
            onPress={() => navigation.navigate("Login")}
          >
            Quay lại đăng nhập
          </Text>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}
