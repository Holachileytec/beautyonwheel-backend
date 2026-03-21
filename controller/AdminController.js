const Admin = require("../models/AdminSchema.js");
const jwt = require("jsonwebtoken");
const User = require("../models/UserSchema.js");

const registerAdmin = async (req, res) => {
  try {
    const { email, username, password, passkey } = req.body;

    // Verify all fields
    if (!email || !username || !password || !passkey) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Verify passkey
    if (passkey !== process.env.ADMIN_DOOR_CODE) {
      return res.status(401).json({ message: "Incorrect passkey" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found. Register at /signup first." });
    }

    // Check if admin already exists for this user
    const existingAdmin = await Admin.findOne({ user: user._id });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ message: "Admin account already exists for this user" });
    }

    // Create admin
    const newAdmin = await Admin.create({
      user: user._id,
      username,
      password,
      code: passkey,
      role: "admin",
    });

    // Update user role to admin
    await User.findByIdAndUpdate(user._id, { role: "admin" });

    const token = jwt.sign(
      { id: user._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    return res.status(201).json({
      message: "Admin registered successfully",
      token,
      admin: newAdmin,
    });
  } catch (error) {
    console.error("registerAdmin error:", error);
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { username, password, passkey } = req.body;

    if (!username || !password || !passkey) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Check passkey
    if (passkey !== process.env.ADMIN_DOOR_CODE) {
      return res.status(401).json({ message: "Incorrect passkey" });
    }

    // Find admin by username
    const admin = await Admin.findOne({ username }).populate(
      "user",
      "-password",
    );
    if (!admin) {
      return res.status(404).json({ message: "Admin account not found" });
    }

    if (password !== admin.password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin.user._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    // ✅ Return user object so frontend can store role correctly
    return res.status(200).json({
      message: "Login Successful!",
      token,
      admin,
      user: {
        _id: admin.user._id,
        name: admin.user.name,
        email: admin.user.email,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

const adminLogout = async (req, res) => {
  try {
    res.clearCookie("token");
    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Logout failed", error: error.message });
  }
};

const getAdmin = async (req, res) => {
  try {
    const admin = await Admin.findOne({ user: req.userId }).populate(
      "user",
      "-password",
    );
    if (!admin) {
      return res.status(404).json({ message: "Admin profile not found." });
    }
    res.status(200).json({ message: "Admin fetched successfully", admin });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const AdminPasscode = async (req, res) => {
  try {
    const { code } = req.body;
    if (code === process.env.ADMIN_DOOR_CODE) {
      const adminUser = await User.findOne({ role: "admin" });
      if (!adminUser)
        return res.status(404).json({ success: false, message: "Admin user" });
      const token = jwt.sign(
        { id: "admin", role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "8h" },
      );
      return res
        .status(200)
        .json({ success: true, messasge: "Access granted!", token });
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Invalid door code." });
    }
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "An error occurred",
        error: error.message,
      });
  }
};

const adminUpdateProfile = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "No update data provided" });
    }
    const admin = await Admin.findOneAndUpdate({ user: req.userId }, req.body, {
      new: true,
      runValidators: true,
    }).populate("user", "-password");

    if (!admin) {
      return res.status(404).json({ message: "Admin profile not found" });
    }
    res
      .status(200)
      .json({ message: "Admin profile updated successfully", admin });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  registerAdmin,
  adminLogin,
  adminLogout,
  adminUpdateProfile,
  getAdmin,
  AdminPasscode,
};
