const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/UserSchema.js");

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_PASS:", process.env.EMAIL_PASS);

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(200)
        .json({ message: "If this email exists, a reset link has been sent." });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Save token to user
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Reset link
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
  from: `"BeautyOnWheels" <${process.env.EMAIL_USER}>`,
  to: user.email,
  subject: "Password Reset Request - BeautyOnWheels",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f4;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #6a0dad, #9b59b6); padding: 30px 20px; border-radius: 10px 10px 0 0; text-align: center;">
        
        <!-- Logo -->
        <img 
          src="../assets/logo.png" 
          alt="BeautyOnWheels Logo" 
          style="max-width: 150px; margin-bottom: 10px;"
        />
        <h1 style="color: white; margin: 0; font-size: 26px; letter-spacing: 1px;">BeautyOnWheels 💄</h1>
        <p style="color: #f0e6ff; margin: 5px 0 0; font-size: 13px;">Beauty at Your Doorstep</p>
      </div>

      <!-- Body -->
      <div style="background-color: #ffffff; padding: 40px 30px;">
        <h2 style="color: #6a0dad; margin-top: 0;">Hi ${user.name || "Valued Customer"} 👋</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.6;">
          We received a request to reset the password for your <strong>BeautyOnWheels</strong> account.
          Click the button below to reset it.
        </p>

        <!-- Reset Button -->
        <div style="text-align: center; margin: 35px 0;">
          <a href="${resetLink}" 
            style="background: linear-gradient(135deg, #6a0dad, #9b59b6); 
            color: white; 
            padding: 15px 40px; 
            border-radius: 25px; 
            text-decoration: none; 
            font-size: 16px; 
            font-weight: bold;
            letter-spacing: 1px;
            display: inline-block;">
            🔐 Reset My Password
          </a>
        </div>

        <!-- Warning -->
        <div style="background-color: #f9f0ff; border-left: 4px solid #6a0dad; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="color: #555; font-size: 14px; margin: 0;">
            ⏰ This link will expire in <strong>1 hour</strong>.
          </p>
        </div>

        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          If you didn't request a password reset, please ignore this email or contact us immediately 
          if you think someone is trying to access your account.
        </p>

        <!-- Contact Info -->
        <div style="background-color: #f9f0ff; padding: 20px; border-radius: 10px; margin: 25px 0;">
          <h3 style="color: #6a0dad; margin-top: 0; font-size: 15px;">📞 Need Help? Contact Us</h3>
          <p style="color: #555; font-size: 14px; margin: 5px 0;">
            📱 <a href="tel:+2348164267868" style="color: #6a0dad; text-decoration: none;">+234 816 426 7868</a>
          </p>
          <p style="color: #555; font-size: 14px; margin: 5px 0;">
            📱 <a href="tel:+2347083878594" style="color: #6a0dad; text-decoration: none;">+234 708 387 8594</a>
          </p>
          <p style="color: #555; font-size: 14px; margin: 5px 0;">
            🌐 <a href="http://www.beautyonwheels.com.ng" style="color: #6a0dad; text-decoration: none;">www.beautyonwheels.com.ng</a>
          </p>
        </div>
      </div>

      <!-- Social Media -->
      <div style="background: linear-gradient(135deg, #6a0dad, #9b59b6); padding: 25px; text-align: center; border-radius: 0 0 10px 10px;">
        <p style="color: white; font-size: 14px; margin: 0 0 15px;">Follow us on social media</p>
        
        <div style="margin-bottom: 15px;">
          <!-- Facebook -->
          <a href="https://facebook.com/beautyonwheel" 
            style="color: white; text-decoration: none; margin: 0 10px; font-size: 13px;">
            📘 @beautyonwheel
          </a>
          <!-- TikTok -->
          <a href="https://tiktok.com/@beautyonwheel" 
            style="color: white; text-decoration: none; margin: 0 10px; font-size: 13px;">
            🎵 @beautyonwheel
          </a>
          <!-- Instagram -->
          <a href="https://instagram.com/beautyonwheel012" 
            style="color: white; text-decoration: none; margin: 0 10px; font-size: 13px;">
            📸 @beautyonwheel012
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.3); margin: 15px 0;" />
        
        <p style="color: #f0e6ff; font-size: 12px; margin: 0;">
          © 2025 BeautyOnWheels. All rights reserved.<br/>
          <a href="http://www.beautyonwheels.com.ng" style="color: #f0e6ff;">www.beautyonwheels.com.ng</a>
        </p>
      </div>

    </div>
  `,
});
    res
      .status(200)
      .json({ message: "If this email exists, a reset link has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

module.exports = { forgotPassword };
