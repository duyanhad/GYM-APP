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

export default function ForgotPasswordVerifyScreen({ route, navigation }) {
  const { email } = route.params;
  const { verifyForgotPassword } = useContext(AuthContext);

  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const { fadeAnim, slideAnim, logoScale } = useAuthCardAnimation();
  const collapseAnim = useRef(new Animated.Value(0)).current;
  const { value: shakeAnim, runShake } = useShakeAnimation();
  const { buttonScale, neonGlow, pressIn, pressOut } = useButtonPressAnimation();

  const collapseCard = () => {
    Animated.sequence([
      Animated.timing(collapseAnim, { toValue: 70, duration: 180, useNativeDriver: true }),
      Animated.timing(collapseAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
  };

  const handleOutsidePress = () => {
    Keyboard.dismiss();
    collapseCard();
  };

  const handleSubmit = () => {
    if (!otp || !newPass || !confirmPass) {
      runShake();
      return;
    }
    verifyForgotPassword(email, otp, newPass, confirmPass, navigation);
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
          {/* Logo */}
          <Animated.View style={{ transform: [{ scale: logoScale }] }}>
            <View style={styles.logoWrapper}>
              <Image source={require("../../assets/logo.png")} style={styles.logo} />
            </View>
          </Animated.View>

          <Text style={styles.title}>Đặt lại mật khẩu</Text>

          <Text style={styles.subtitle}>OTP đã gửi tới {email}</Text>

          <TextInput
            style={styles.input}
            placeholder="Mã OTP"
            placeholderTextColor="#aaa"
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
          />

          <TextInput
            style={styles.input}
            placeholder="Mật khẩu mới"
            secureTextEntry
            value={newPass}
            onChangeText={setNewPass}
          />

          <TextInput
            style={styles.input}
            placeholder="Nhập lại mật khẩu"
            secureTextEntry
            value={confirmPass}
            onChangeText={setConfirmPass}
          />

          <Pressable onPress={handleSubmit} onPressIn={pressIn} onPressOut={pressOut}>
            <Animated.View style={[styles.button, { transform: [{ scale: buttonScale }] }]}>
              <Text style={styles.btnText}>Xác nhận</Text>
              <Animated.View style={[styles.neonOverlay, { opacity: neonGlow }]} />
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}
