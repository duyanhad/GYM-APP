
import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  Animated,
  Pressable,
  Alert,
} from "react-native";
import { AuthContext } from "../../context/AuthContext";

import { authStyles } from "./authStyles";
import {
  useAuthCardAnimation,
  useShakeAnimation,
  useButtonPressAnimation,
} from "./authAnimations";

const styles = authStyles;

export default function RegisterScreen({ navigation }) {
  const { register } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { fadeAnim, slideAnim, logoScale } = useAuthCardAnimation();
  const { value: shakeInput, runShake: runShakeInput } = useShakeAnimation();
  const { buttonScale, neonGlow, pressIn, pressOut } =
    useButtonPressAnimation();

  const validateForm = () => {
    let newErrors = {};

    if (!name.trim()) newErrors.name = "Vui lòng nhập tên";
    if (!/^[0-9]{9,11}$/.test(phone))
      newErrors.phone = "Số điện thoại không hợp lệ";
    if (!email.includes("@") || email.length < 5)
      newErrors.email = "Email không hợp lệ";
    if (password.length < 6)
      newErrors.password = "Mật khẩu phải từ 6 ký tự trở lên";
    if (password !== confirm)
      newErrors.confirm = "Mật khẩu nhập lại không trùng";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      runShakeInput();
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (loading) return;

    pressIn();
    setTimeout(() => pressOut(), 120);

    if (!validateForm()) return;

    setLoading(true);

    try {
      await register(name, phone, email, password, confirm, navigation);
    } catch (err) {
      console.log(err);
      Alert.alert("Lỗi đăng ký", "Không thể tạo tài khoản.");
      runShakeInput();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <Animated.View
        style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <Animated.View style={{ transform: [{ scale: logoScale }] }}>
          <View style={styles.logoWrapper}>
            <Image source={require("../../assets/logo.png")} style={styles.logo} />
          </View>
        </Animated.View>

        <Text style={styles.title}>Tạo tài khoản</Text>

        <Animated.View style={{ width: "100%", transform: [{ translateX: shakeInput }] }}>
          <TextInput
            placeholder="Tên đầy đủ"
            placeholderTextColor="#888"
            style={[styles.input, errors.name && styles.inputError]}
            value={name}
            onChangeText={setName}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          <TextInput
            placeholder="Số điện thoại"
            placeholderTextColor="#888"
            keyboardType="numeric"
            style={[styles.input, errors.phone && styles.inputError]}
            value={phone}
            onChangeText={setPhone}
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

          <TextInput
            placeholder="Email"
            placeholderTextColor="#888"
            autoCapitalize="none"
            style={[styles.input, errors.email && styles.inputError]}
            value={email}
            onChangeText={setEmail}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <TextInput
            placeholder="Mật khẩu"
            placeholderTextColor="#888"
            secureTextEntry
            style={[styles.input, errors.password && styles.inputError]}
            value={password}
            onChangeText={setPassword}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          <TextInput
            placeholder="Nhập lại mật khẩu"
            placeholderTextColor="#888"
            secureTextEntry
            style={[styles.input, errors.confirm && styles.inputError]}
            value={confirm}
            onChangeText={setConfirm}
          />
          {errors.confirm && <Text style={styles.errorText}>{errors.confirm}</Text>}
        </Animated.View>

        <Pressable onPress={handleRegister} onPressIn={pressIn} onPressOut={pressOut}>
          <Animated.View
            style={[styles.button, { transform: [{ scale: buttonScale }] }]}
          >
            <Text style={styles.btnText}>{loading ? "Đang xử lý..." : "Đăng ký"}</Text>
            <Animated.View style={[styles.neonOverlay, { opacity: neonGlow }]} />
          </Animated.View>
        </Pressable>

        <Text style={styles.switchText} onPress={() => navigation.navigate("Login")}>
          Đã có tài khoản?{" "}
          <Text style={{ color: "#e53935", fontWeight: "bold" }}>Đăng nhập</Text>
        </Text>
      </Animated.View>
    </View>
  );
}
