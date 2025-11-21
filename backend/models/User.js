// backend/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    phone: { type: String, required: true },

    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["user", "coach", "admin"],
      default: "user",
    },

    // ====== 2FA / OTP ======
    isVerified: {
      type: Boolean,
      default: false,
    },
    otpCode: String,        // mã OTP 6 số
    otpExpires: Date,       // thời gian hết hạn
    otpPurpose: String,     // 'register' | 'login' | 'reset'
    otpAttempts: {
      type: Number,
      default: 0,           // số lần nhập sai
    },
    otpLastSent: Date,      // lần gửi gần nhất (để chặn spam resend)
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
