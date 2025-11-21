import React, { useState, useContext, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Animated,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { AuthContext } from "../../context/AuthContext";
import { authStyles } from "./authStyles";
import {
  useAuthCardAnimation,
  useButtonPressAnimation,
  useShakeAnimation,
} from "./authAnimations";

const styles = authStyles;

export default function ForgotPasswordScreen({ navigation }) {
  const { startForgotPassword } = useContext(AuthContext);
  const [email, setEmail] = useState("");

  const { fadeAnim, slideAnim, logoScale } = useAuthCardAnimation();
  const { value: shakeAnim, runShake } = useShakeAnimation();
  const collapseAnim = useRef(new Animated.Value(0)).current;
  const { buttonScale, neonGlow, pressIn, pressOut } =
    useButtonPressAnimation();

  // Nhún card khi ấn ra ngoài
  const collapseCard = () => {
    Animated.sequence([
      Animated.timing(collapseAnim, {
        toValue: 70,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(collapseAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleOutsidePress = () => {
    Keyboard.dismiss();
    collapseCard();
  };

  const handleSend = () => {
    if (!email.trim()) {
      runShake();
      return;
    }
    startForgotPassword(email, navigation);
  };

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
                { translateX: shakeAnim },
              ],
            },
          ]}
        >
          <Animated.View style={{ transform: [{ scale: logoScale }] }}>
            <View style={styles.logoWrapper}>
              <Image
                source={require("../../assets/logo.png")}
                style={styles.logo}
              />
            </View>
          </Animated.View>

          <Text style={styles.title}>Quên mật khẩu</Text>
          <Text style={styles.subtitle}>
            Nhập email để nhận mã OTP đặt lại mật khẩu.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
          />

          <Pressable
            onPress={handleSend}
            onPressIn={pressIn}
            onPressOut={pressOut}
          >
            <Animated.View
              style={[styles.button, { transform: [{ scale: buttonScale }] }]}
            >
              <Text style={styles.btnText}>Gửi OTP</Text>
              <Animated.View
                style={[styles.neonOverlay, { opacity: neonGlow }]}
              />
            </Animated.View>
          </Pressable>

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
