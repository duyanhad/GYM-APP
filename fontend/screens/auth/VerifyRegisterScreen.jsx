
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Animated,
  Image,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { AuthContext } from "../../context/AuthContext";

export default function VerifyRegisterScreen({ route, navigation }) {
  const { email } = route.params;
  const { verifyRegister, resendRegisterOTP } = useContext(AuthContext);

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(60);
  const inputsRef = useRef([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
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

  const handleOutsidePress = () => {
    Keyboard.dismiss();
    collapseCard();
  };

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
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [seconds]);

  const runShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -4, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleChangeDigit = (text, index) => {
    if (text && !/^[0-9]$/.test(text)) return;

    const newDigits = [...digits];
    newDigits[index] = text;
    setDigits(newDigits);

    if (text && index < 5) inputsRef.current[index + 1]?.focus();
    if (!text && index > 0) inputsRef.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = digits.join("");
    if (code.length !== 6) {
      runShake();
      Alert.alert("Lỗi", "Vui lòng nhập đủ 6 số OTP.");
      return;
    }

    setLoading(true);
    try {
      await verifyRegister(email, code, navigation);
    } catch {
      runShake();
      Alert.alert("Lỗi", "Không thể xác thực OTP.");
    } finally {
      setLoading(false);
    }
  };

  // ======= RESEND OTP (KHÔNG CÒN ALERT 2 LẦN) =======
  const handleResend = async () => {
    if (seconds > 0) return;

    const result = await resendRegisterOTP(email);

    if (!result.ok) {
      if (result.status === 429) {
        Alert.alert("Thông báo", result.message);
        setSeconds(60);
        return;
      }

      Alert.alert("Lỗi", result.message);
      return;
    }

    Alert.alert("Thông báo", result.message);
    setSeconds(60);
  };

  const otpFilledCount = digits.filter((d) => d !== "").length;

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <View style={styles.root}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { translateY: collapseAnim },
              ],
            },
          ]}
        >
          <View style={styles.logoWrapper}>
            <Image
              source={require("../../assets/logo.png")}
              style={styles.logo}
            />
          </View>

          <Text style={styles.title}>Xác thực tài khoản</Text>
          <Text style={styles.subtitle}>
            Mã xác thực đã gửi đến <Text style={styles.bold}>{email}</Text>
          </Text>

          <Animated.View
            style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}
          >
            {digits.map((digit, index) => (
              <TextInput
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                style={styles.otpInput}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleChangeDigit(text, index)}
              />
            ))}
          </Animated.View>

          <Pressable
            style={[styles.button, otpFilledCount < 4 && { opacity: 0.7 }]}
            onPress={handleVerify}
            disabled={loading}
          >
            <Text style={styles.btnText}>
              {loading ? "Đang xác thực..." : "Xác nhận"}
            </Text>
          </Pressable>

          <View style={styles.resendRow}>
            {seconds > 0 ? (
              <Text style={styles.resendText}>
                Gửi lại mã sau <Text style={styles.bold}>{seconds}s</Text>
              </Text>
            ) : (
              <Pressable onPress={handleResend}>
                <Text style={styles.resendLink}>Gửi lại mã OTP</Text>
              </Pressable>
            )}
          </View>

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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#1b1f20",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "90%",
    backgroundColor: "#000",
    padding: 30,
    borderRadius: 30,
    alignItems: "center",
  },
  logoWrapper: {
    width: 110,
    height: 110,
    backgroundColor: "#222",
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#e53935",
    marginBottom: 20,
  },
  logo: { width: 70, height: 70, borderRadius: 35 },
  title: { fontSize: 26, fontWeight: "800", color: "#fff", marginBottom: 10 },
  subtitle: { color: "#aaa", marginBottom: 20, textAlign: "center" },
  bold: { color: "#fff", fontWeight: "700" },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  otpInput: {
    width: 45,
    height: 55,
    backgroundColor: "#fff",
    borderRadius: 10,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
  },
  button: {
    backgroundColor: "#e53935",
    padding: 15,
    width: "100%",
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  resendRow: { marginBottom: 10 },
  resendText: { color: "#ccc" },
  resendLink: { color: "#e53935", fontWeight: "700" },
  backText: { color: "#ddd", textAlign: "center", marginTop: 4 },
});
