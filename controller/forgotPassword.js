const crypto = require("crypto");
const axios = require("axios");
const User = require("../models/UserSchema.js");

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(200)
        .json({ message: "If this email exists, a reset link has been sent." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000;

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { name: "BeautyOnWheels", email: process.env.BREVO_SMTP_USER },
        to: [{ email: user.email }],
        subject: "Password Reset Request - BeautyOnWheels",
        htmlContent: `<p>Hi ${user.name || "Valued Customer"},</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetLink}">Reset My Password</a>
          <p>This link expires in 1 hour.</p>`,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json({ message: "If this email exists, a reset link has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error.response?.data || error.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

module.exports = { forgotPassword };
