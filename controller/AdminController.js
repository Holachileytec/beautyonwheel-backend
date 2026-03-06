const Admin = require("../models/AdminSchema.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/UserSchema.js"); // add this at the top

const registerAdmin = async (req, res) => {
  try {
    const { userId, username, password, passkey } = req.body;

    // Verify passkey
    if (passkey !== process.env.ADMIN_DOOR_CODE) {
      return res.status(401).json({ message: "Incorrect passkey" });
    }

    // Check user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if admin already exists for this user
    const existingAdmin = await Admin.findOne({ user: userId });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ message: "Admin account already exists for this user" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const newAdmin = await Admin.create({
      user: userId,
      username,
      password: hashedPassword,
      code: passkey,
      role: "support",
    });

    // Update user role to admin
    await User.findByIdAndUpdate(userId, { role: "admin" });

    const token = jwt.sign(
      { id: userId, role: "admin" },
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

    // Check passkey first
    if (passkey !== process.env.ADMIN_DOOR_CODE) {
      return res.status(401).json({ message: "Incorrect passkey" });
    }

    // Find admin by username
    const admin = await Admin.findOne({ username }).populate(
      "user",
      "-password",
    );

    if (!admin) {
      return res
        .status(404)
        .json({ message: "Admin account not found. Contact superadmin." });
    }

    // Verify password
    const aMatch = await bcrypt.compare(password, admin.password);
    if (!aMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin.user._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    return res.status(200).json({ message: "Login Successful!", token, admin });
  } catch (error) {
    console.error("Admin login error:", error);
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};
const adminLogout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid"); // clear session cookie
      res.status(200).json({ message: "Logged out successfully" });
    });
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
    const MASTER_CODE = process.env.ADMIN_DOOR_CODE;
    if (code === MASTER_CODE) {
      const token = jwt.sign(
        { id: "admin", role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "8h" },
      );
      return res
        .status(200)
        .json({ success: true, message: "Access granted!", token });
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Invalid door code." });
    }
  } catch (error) {
    res.status(500).json({
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
