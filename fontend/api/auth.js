import axios from "axios";

// Nhớ sửa IP + PORT cho đúng với Backend của bạn
const API = "http://192.168.0.103:4000/api";

/* ===========================
    REGISTER (Đăng ký)
=========================== */
export const registerAPI = (name, phone, email, password, confirm) => {
  return axios.post(`${API}/auth/register`, {
    name,
    email,
    phone,
    password,
    confirm,
    role: "user",
  });
};

// Xác thực OTP đăng ký
export const verifyRegisterAPI = (email, otp) => {
  return axios.post(`${API}/auth/verify-register`, { email, otp });
};

// Gửi lại OTP đăng ký
export const resendRegisterOTPAPI = (email) => {
  return axios.post(`${API}/auth/resend-register-otp`, { email });
};

/* ===========================
    LOGIN (Đăng nhập OTP)
=========================== */

// Bước 1: Đăng nhập → gửi OTP về email
export const loginSendOTPAPI = (email, password) => {
  return axios.post(`${API}/auth/login`, { email, password });
};

// Bước 2: Xác thực OTP đăng nhập
export const verifyLoginOTPAPI = (email, otp) => {
  return axios.post(`${API}/auth/login-verify`, { email, otp });
};

// Gửi lại OTP đăng nhập
export const resendLoginOTPAPI = (email) => {
  return axios.post(`${API}/auth/resend-login-otp`, { email });
};

/* ===========================
    FORGOT PASSWORD
=========================== */

// Bước 1: Nhập email → gửi OTP
export const forgotPasswordStartAPI = (email) => {
  return axios.post(`${API}/auth/forgot-password-start`, { email });
};

// Bước 2: Xác thực OTP + đổi mật khẩu
export const forgotPasswordVerifyAPI = (
  email,
  otp,
  newPassword,
  confirmPassword
) => {
  return axios.post(`${API}/auth/forgot-password-verify`, {
    email,
    otp,
    newPassword,
    confirmPassword,
  });
};
