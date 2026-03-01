const Admin = require("../models/AdminSchema.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/**
 * Get Admin Profile
 * GET /api/admins/profile
 * Requires: auth + isAdmin middleware
 */
const adminLogin = async (req, res) => {
  try {
    const { username, password, passkey } = req.body;

    if (passkey !== process.env.ADMIN_DOOR_CODE) {
      res.status(401).json({ messsage: "Incorrect passkey" });
    }
    let admin = await Admin.find({ username });

    if (admin) {
      const aMatch = await bcrypt.compare(password, admin.password);
      if (!aMatch) {
        res.status(400).json({ message: "Invalid credentials" });
      }
      const token = jwt.sign({ id: admin._id }, process.env.ADMIN_DOOR_CODE, {
        expiresIn: "1h",
      });
      return res
        .status(200)
        .json({ message: "Login Successful!", token, admin });
    } else {
      const safePassword = await bcrypt.hash(password, 10);

      const newAcc = await Admin.create({
        username: username,
        password: safePassword,
        code: passkey,
      });

      res
        .status(200)
        .json({ message: "Admin account created successfully", newAcc });
    }
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      message: "An error occured while creating admin profile",
      error,
    });
    console.error(error.message);
  }
};

const getAdmin = async (req, res) => {
  try {
    const admin = await Admin.findOne({ user: req.userId }).populate(
      "user",
      "-password",
    );

    if (!admin) {
      // Admin profile doesn't exist - this shouldn't happen if registration worked
      return res.status(404).json({
        message: "Admin profile not found. Please contact support.",
        userId: req.userId,
      });
    }

    res.status(200).json({
      message: "Admin fetched successfully",
      admin,
    });
  } catch (error) {
    console.error("getAdmin error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Update Admin Profile
 * PUT /api/admins/profile
 * Requires: auth + isAdmin middleware
 */

// adminController.js
const AdminPasscode = async (req, res) => {
  try {
    const { code } = req.body;
    const MASTER_CODE = process.env.ADMIN_DOOR_CODE;

    if (code === MASTER_CODE) {
      return res.status(200).json({
        success: true,
        message: "Access code match!",
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid door code.",
      });
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
    // Validate that there's something to update
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "No update data provided" });
    }

    const admin = await Admin.findOneAndUpdate({ user: req.userId }, req.body, {
      new: true,
      runValidators: true,
    }).populate("user", "-password");

    if (!admin) {
      return res.status(404).json({
        message: "Admin profile not found",
        userId: req.userId,
      });
    }

    res.status(200).json({
      message: "Admin profile updated successfully",
      admin,
    });
  } catch (error) {
    console.error("adminUpdateProfile error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }

    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = { adminUpdateProfile, getAdmin, AdminPasscode, adminLogin };
