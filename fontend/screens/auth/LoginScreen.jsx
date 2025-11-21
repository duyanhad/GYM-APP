
import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  Animated,
  Pressable,
} from "react-native";
import { AuthContext } from "../../context/AuthContext";

import { authStyles } from "./authStyles";
import {
  useAuthCardAnimation,
  useShakeAnimation,
  useButtonPressAnimation,
} from "./authAnimations";

const styles = authStyles;

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { fadeAnim, slideAnim, logoScale } = useAuthCardAnimation();
  const { value: inputShake, runShake: runInputShake } = useShakeAnimation();
  const { value: logoShake, runShake: runLogoShake } = useShakeAnimation();
  const { buttonScale, neonGlow, pressIn, pressOut } =
    useButtonPressAnimation();

  const validateLogin = () => {
    let err = {};

    if (!email.includes("@")) err.email = "Email không hợp lệ";
    if (password.length < 6) err.password = "Mật khẩu phải từ 6 ký tự";

    setErrors(err);

    if (Object.keys(err).length > 0) {
      runInputShake();
      return false;
    }

    return true;
  };

  const handleLogin = () => {
    if (loading) return;

    pressIn();
    setTimeout(() => pressOut(), 120);

    if (!validateLogin()) return;

    setLoading(true);

    setTimeout(async () => {
      try {
        const res = await login(email, password, navigation);

        if (res?.needVerify) {
          navigation.navigate("VerifyLoginOTP", { email });
          return;
        }

        if (!res?.token) {
          runLogoShake();
          setErrors({ password: "Sai email hoặc mật khẩu" });
          return;
        }
      } catch (err) {
        console.log(err);
        runLogoShake();
      } finally {
        setLoading(false);
      }
    }, 10);
  };

  return (
    <View style={styles.root}>
      <Animated.View
        style={[
          styles.card,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Animated.View
          style={{
            transform: [{ scale: logoScale }, { translateX: logoShake }],
          }}
        >
          <View style={styles.logoWrapper}>
            <Image source={require("../../assets/logo.png")} style={styles.logo} />
          </View>
        </Animated.View>

        <Text style={styles.title}>Gym Training App</Text>
        <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>

        <Animated.View
          style={{ width: "100%", transform: [{ translateX: inputShake }] }}
        >
          <TextInput
            placeholder="Email"
            placeholderTextColor="#666"
            style={[styles.input, errors.email && styles.inputError]}
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          {errors.email && (
            <Text style={styles.errorText}>{errors.email}</Text>
          )}

          <TextInput
            placeholder="Mật khẩu"
            placeholderTextColor="#666"
            secureTextEntry
            style={[styles.input, errors.password && styles.inputError]}
            value={password}
            onChangeText={setPassword}
          />
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}
        </Animated.View>

        {/* BUTTON */}
        <Pressable onPress={handleLogin} onPressIn={pressIn} onPressOut={pressOut}>
          <Animated.View
            style={[styles.button, { transform: [{ scale: buttonScale }] }]}
          >
            <Text style={styles.btnText}>
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </Text>
            <Animated.View style={[styles.neonOverlay, { opacity: neonGlow }]} />
          </Animated.View>
        </Pressable>

        <Text
          style={styles.forgot}
          onPress={() => navigation.navigate("ForgotPassword")}
        >
          Quên mật khẩu?
        </Text>

        <Text
          style={styles.switchText}
          onPress={() => navigation.navigate("Register")}
        >
          Chưa có tài khoản?{" "}
          <Text style={{ color: "#e53935", fontWeight: "bold" }}>Đăng ký</Text>
        </Text>
      </Animated.View>
    </View>
  );
}
