// backend/routes/authRoutes.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendOTP = require("../utils/sendOTP");

const router = express.Router();
const MAX_OTP_ATTEMPTS = 5;

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function canResend(user) {
  if (!user.otpLastSent) return true;
  const diff = Date.now() - user.otpLastSent.getTime();
  return diff > 60 * 1000; // 60s
}

// ============ ĐĂNG KÝ + GỬI OTP =============
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password, confirm, role } = req.body;

    if (!name?.trim()) return res.status(400).json({ message: "Tên không hợp lệ" });
    if (!/^[0-9]{9,11}$/.test(phone))
      return res.status(400).json({ message: "Số điện thoại không hợp lệ" });
    if (!email || !email.includes("@"))
      return res.status(400).json({ message: "Email không hợp lệ" });
    if (!password || password.length < 6)
      return res.status(400).json({ message: "Mật khẩu phải từ 6 ký tự" });
    if (password !== confirm)
      return res.status(400).json({ message: "Mật khẩu nhập lại không trùng" });

    let user = await User.findOne({ email });

    if (user && user.isVerified) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    if (!user) {
      user = await User.create({
        name,
        email,
        phone,
        password: hashed,
        role: role || "user",
      });
    } else {
      // đã tồn tại nhưng chưa verify => cập nhật lại dữ liệu
      user.name = name;
      user.phone = phone;
      user.password = hashed;
      user.role = role || "user";
    }

    user.isVerified = false;
    user.otpCode = otp;
    user.otpPurpose = "register";
    user.otpExpires = new Date(Date.now() + 3 * 60 * 1000);
    user.otpAttempts = 0;
    user.otpLastSent = new Date();
    await user.save();

    await sendOTP(email, otp);

    return res.json({
      message: "Đăng ký thành công. Vui lòng kiểm tra email để nhập OTP.",
      email: user.email,
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ message: "Lỗi server khi đăng ký" });
  }
});

// Xác thực OTP đăng ký
router.post("/verify-register", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Không tìm thấy tài khoản" });

    if (user.isVerified)
      return res.status(400).json({ message: "Tài khoản đã được xác thực" });

    if (user.otpPurpose !== "register")
      return res.status(400).json({ message: "OTP không hợp lệ" });

    if (user.otpAttempts >= MAX_OTP_ATTEMPTS)
      return res.status(400).json({
        message: "Bạn đã nhập sai quá số lần. Hãy yêu cầu gửi lại OTP.",
      });

    if (!user.otpCode || user.otpCode !== otp) {
      user.otpAttempts += 1;
      await user.save();
      const left = MAX_OTP_ATTEMPTS - user.otpAttempts;
      return res.status(400).json({
        message: `OTP sai. Bạn còn ${left < 0 ? 0 : left} lần thử.`,
      });
    }

    if (user.otpExpires < Date.now())
      return res.status(400).json({ message: "OTP đã hết hạn" });

    user.isVerified = true;
    user.otpCode = undefined;
    user.otpPurpose = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    await user.save();

    return res.json({ message: "Xác thực tài khoản thành công" });
  } catch (err) {
    console.error("VERIFY REGISTER ERROR:", err);
    return res.status(500).json({ message: "Lỗi server khi xác thực" });
  }
});

// Resend OTP đăng ký
router.post("/resend-register-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Không tìm thấy tài khoản" });
    if (user.isVerified)
      return res.status(400).json({ message: "Tài khoản đã được xác thực" });

    if (!canResend(user))
      return res.status(429).json({ message: "Vui lòng đợi 60s rồi gửi lại." });

    const otp = generateOTP();
    user.otpCode = otp;
    user.otpPurpose = "register";
    user.otpExpires = new Date(Date.now() + 3 * 60 * 1000);
    user.otpAttempts = 0;
    user.otpLastSent = new Date();
    await user.save();

    await sendOTP(user.email, otp);
    return res.json({ message: "Đã gửi lại OTP đăng ký." });
  } catch (err) {
    console.error("RESEND REGISTER OTP ERROR:", err);
    return res.status(500).json({ message: "Không thể gửi lại OTP" });
  }
});

// ============ LOGIN STEP 1: GỬI OTP ============
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Sai email hoặc mật khẩu" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Sai email hoặc mật khẩu" });

    if (!user.isVerified)
      return res.status(400).json({
        message: "Tài khoản chưa được xác thực, hãy kiểm tra email OTP đăng ký.",
      });

    if (!canResend(user))
      return res.status(429).json({ message: "Vui lòng đợi 60s rồi thử lại." });

    const otp = generateOTP();
    user.otpCode = otp;
    user.otpPurpose = "login";
    user.otpExpires = new Date(Date.now() + 3 * 60 * 1000);
    user.otpAttempts = 0;
    user.otpLastSent = new Date();
    await user.save();

    await sendOTP(user.email, otp);

    return res.json({
      message: "OTP đăng nhập đã được gửi.",
      email: user.email,
    });
  } catch (err) {
    console.error("LOGIN SEND OTP ERROR:", err);
    return res.status(500).json({ message: "Lỗi server khi gửi OTP đăng nhập" });
  }
});

// LOGIN STEP 2: VERIFY OTP
router.post("/login-verify", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Không tìm thấy tài khoản" });

    if (user.otpPurpose !== "login")
      return res.status(400).json({ message: "OTP không hợp lệ" });

    if (user.otpAttempts >= MAX_OTP_ATTEMPTS)
      return res.status(400).json({
        message: "Bạn đã nhập sai quá số lần. Hãy yêu cầu gửi lại OTP.",
      });

    if (!user.otpCode || user.otpCode !== otp) {
      user.otpAttempts += 1;
      await user.save();
      const left = MAX_OTP_ATTEMPTS - user.otpAttempts;
      return res.status(400).json({
        message: `OTP sai. Bạn còn ${left < 0 ? 0 : left} lần thử.`,
      });
    }

    if (user.otpExpires < Date.now())
      return res.status(400).json({ message: "OTP đã hết hạn" });

    // xoá OTP
    user.otpCode = undefined;
    user.otpPurpose = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("LOGIN VERIFY ERROR:", err);
    return res.status(500).json({ message: "Lỗi server khi xác thực OTP" });
  }
});

// Resend OTP login
router.post("/resend-login-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Không tìm thấy tài khoản" });

    if (!canResend(user))
      return res.status(429).json({ message: "Vui lòng đợi 60s rồi gửi lại." });

    const otp = generateOTP();
    user.otpCode = otp;
    user.otpPurpose = "login";
    user.otpExpires = new Date(Date.now() + 3 * 60 * 1000);
    user.otpAttempts = 0;
    user.otpLastSent = new Date();
    await user.save();

    await sendOTP(user.email, otp);
    return res.json({ message: "Đã gửi lại OTP đăng nhập." });
  } catch (err) {
    console.error("RESEND LOGIN OTP ERROR:", err);
    return res.status(500).json({ message: "Không thể gửi lại OTP" });
  }
});

// ============ QUÊN MẬT KHẨU ============
router.post("/forgot-password-start", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Không tìm thấy tài khoản" });

    if (!canResend(user))
      return res.status(429).json({ message: "Vui lòng đợi 60s rồi gửi lại." });

    const otp = generateOTP();
    user.otpCode = otp;
    user.otpPurpose = "reset";
    user.otpExpires = new Date(Date.now() + 3 * 60 * 1000);
    user.otpAttempts = 0;
    user.otpLastSent = new Date();
    await user.save();

    await sendOTP(user.email, otp);
    return res.json({ message: "Đã gửi OTP đặt lại mật khẩu." });
  } catch (err) {
    console.error("FORGOT PASSWORD START ERROR:", err);
    return res.status(500).json({ message: "Không thể gửi OTP" });
  }
});

router.post("/forgot-password-verify", async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Không tìm thấy tài khoản" });

    if (user.otpPurpose !== "reset")
      return res.status(400).json({ message: "OTP không hợp lệ" });

    if (user.otpAttempts >= MAX_OTP_ATTEMPTS)
      return res.status(400).json({
        message: "Bạn đã nhập sai quá số lần. Hãy yêu cầu gửi lại OTP.",
      });

    if (!user.otpCode || user.otpCode !== otp) {
      user.otpAttempts += 1;
      await user.save();
      const left = MAX_OTP_ATTEMPTS - user.otpAttempts;
      return res.status(400).json({
        message: `OTP sai. Bạn còn ${left < 0 ? 0 : left} lần thử.`,
      });
    }

    if (user.otpExpires < Date.now())
      return res.status(400).json({ message: "OTP đã hết hạn" });

    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ message: "Mật khẩu mới phải từ 6 ký tự" });

    if (newPassword !== confirmPassword)
      return res.status(400).json({ message: "Xác nhận mật khẩu không trùng" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.otpCode = undefined;
    user.otpPurpose = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    await user.save();

    return res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    console.error("FORGOT PASSWORD VERIFY ERROR:", err);
    return res.status(500).json({ message: "Không thể đặt lại mật khẩu" });
  }
});

module.exports = router;
