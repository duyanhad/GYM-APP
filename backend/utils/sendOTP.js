// backend/utils/sendOTP.js
const nodemailer = require("nodemailer");

async function sendOTP(email, otp) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Gym Training App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Mã OTP xác thực - Gym Training App",
    html: `
      <h2>Mã xác thực OTP</h2>
      <p>Mã OTP của bạn là: <b style="font-size:20px">${otp}</b></p>
      <p>Mã có hiệu lực trong 3 phút.</p>
    `,
  });
}

module.exports = sendOTP;
