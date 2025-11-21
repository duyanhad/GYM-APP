import React, { createContext, useState } from "react";
import { Alert } from "react-native";
import {
  registerAPI,
  verifyRegisterAPI,
  resendRegisterOTPAPI,
  loginSendOTPAPI,
  verifyLoginOTPAPI,
  resendLoginOTPAPI,
  forgotPasswordStartAPI,
  forgotPasswordVerifyAPI,
} from "../api/auth";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [role, setRole] = useState(null);

  // ===== REGISTER =====
  const register = async (name, phone, email, password, confirm, navigation) => {
    try {
      await registerAPI(name, phone, email, password, confirm);
      Alert.alert("Thành công", "Đã gửi OTP, vui lòng kiểm tra email.");
      navigation.navigate("VerifyRegister", { email });
    } catch (err) {
      Alert.alert(
        "Lỗi đăng ký",
        err.response?.data?.message || "Không thể đăng ký."
      );
    }
  };

  const verifyRegister = async (email, otp, navigation) => {
    try {
      await verifyRegisterAPI(email, otp);
      Alert.alert("Thành công", "Tài khoản đã được xác thực, hãy đăng nhập.");
      navigation.navigate("Login");
    } catch (err) {
      Alert.alert(
        "Lỗi xác thực",
        err.response?.data?.message || "OTP không hợp lệ."
      );
    }
  };

  // ===== RESEND OTP REGISTER — ĐÃ FIX HOÀN CHỈNH =====
  const resendRegisterOTP = async (email) => {
    try {
      const res = await resendRegisterOTPAPI(email);

      return {
        ok: true,
        message: res.data?.message || "Đã gửi lại OTP.",
      };
    } catch (err) {
      return {
        ok: false,
        status: err.response?.status,
        message: err.response?.data?.message || "Không thể gửi lại OTP.",
      };
    }
  };

  // ===== LOGIN + OTP =====
  const login = async (email, password, navigation) => {
    try {
      await loginSendOTPAPI(email, password);
      Alert.alert("OTP đã gửi", "Vui lòng kiểm tra email và nhập mã.");
      navigation.navigate("VerifyLoginOTP", { email });
    } catch (err) {
      Alert.alert(
        "Lỗi đăng nhập",
        err.response?.data?.message || "Không thể gửi OTP."
      );
    }
  };

  const confirmLogin = async (email, otp, navigation) => {
    try {
      const res = await verifyLoginOTPAPI(email, otp);
      setUserToken(res.data.token);
      const userRole = res.data.user.role || "user";
      setRole(userRole);

      if (userRole === "admin") navigation.replace("AdminStack");
      else if (userRole === "coach") navigation.replace("CoachStack");
      else navigation.replace("UserStack");
    } catch (err) {
      Alert.alert(
        "Lỗi xác thực",
        err.response?.data?.message || "OTP không hợp lệ."
      );
    }
  };

  // ===== RESEND LOGIN OTP =====
  const resendLoginOTP = async (email) => {
    try {
      const res = await resendLoginOTPAPI(email);
      Alert.alert("Thông báo", res.data?.message || "Đã gửi lại OTP.");
    } catch (err) {
      Alert.alert(
        "Lỗi",
        err.response?.data?.message || "Không thể gửi lại OTP."
      );
    }
  };

  // ===== FORGOT PASSWORD =====
  const startForgotPassword = async (email, navigation) => {
    try {
      await forgotPasswordStartAPI(email);
      Alert.alert("Thông báo", "Đã gửi OTP đặt lại mật khẩu.");
      navigation.navigate("ForgotPasswordVerify", { email });
    } catch (err) {
      Alert.alert(
        "Lỗi",
        err.response?.data?.message || "Không thể gửi OTP."
      );
    }
  };

  const verifyForgotPassword = async (
    email,
    otp,
    newPassword,
    confirmPassword,
    navigation
  ) => {
    try {
      await forgotPasswordVerifyAPI(email, otp, newPassword, confirmPassword);
      Alert.alert("Thành công", "Đặt lại mật khẩu thành công.");
      navigation.navigate("Login");
    } catch (err) {
      Alert.alert(
        "Lỗi đặt lại mật khẩu",
        err.response?.data?.message || "Không thể đặt lại mật khẩu."
      );
    }
  };

  return (
    <AuthContext.Provider
      value={{
        userToken,
        role,
        register,
        verifyRegister,
        resendRegisterOTP,
        login,
        confirmLogin,
        resendLoginOTP,
        startForgotPassword,
        verifyForgotPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
