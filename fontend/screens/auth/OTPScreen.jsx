import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";

import { authStyles } from "./authStyles";

const styles = authStyles;

export default function OTPScreen({ route, navigation }) {
  const { email } = route.params;
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const refs = useRef([]);

  const handleChange = (text, index) => {
    if (/^\d$/.test(text) || text === "") {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);

      if (text && index < 5) refs.current[index + 1].focus();
      if (!text && index > 0) refs.current[index - 1].focus();
    }
  };

  const verifyOTP = () => {
    const code = otp.join("");

    if (code.length !== 6) {
      return Alert.alert("Lỗi", "Vui lòng nhập đủ 6 số!");
    }

    Alert.alert("Thành công", "Xác thực OTP thành công!");
    navigation.navigate("Login");
  };

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.title}>Nhập mã OTP</Text>
        <Text style={styles.subtitle}>
          Mã đã gửi đến <Text style={styles.bold}>{email}</Text>
        </Text>

        <View style={styles.otpRow}>
          {otp.map((value, index) => (
            <TextInput
              key={index}
              ref={(el) => (refs.current[index] = el)}
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={1}
              value={value}
              onChangeText={(text) => handleChange(text, index)}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={verifyOTP}>
          <Text style={styles.btnText}>Xác nhận</Text>
        </TouchableOpacity>

        <Text
          style={styles.backText}
          onPress={() => navigation.navigate("Login")}
        >
          Quay lại đăng nhập
        </Text>
      </View>
    </View>
  );
}
