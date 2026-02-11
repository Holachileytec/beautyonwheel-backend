const Admin = require("../models/AdminSchema.js");

/**
 * Get Admin Profile
 * GET /api/admins/profile
 * Requires: auth + isAdmin middleware
 */
const getAdmin = async (req, res) => {
  try {
    const admin = await Admin.findOne({ user: req.userId }).populate("user", "-password");
    
    if (!admin) {
      // Admin profile doesn't exist - this shouldn't happen if registration worked
      return res.status(404).json({ 
        message: "Admin profile not found. Please contact support.",
        userId: req.userId
      });
    }
    
    res.status(200).json({ 
      message: "Admin fetched successfully", 
      admin 
    });
  } catch (error) {
    console.error("getAdmin error:", error);
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};

/**
 * Update Admin Profile
 * PUT /api/admins/profile
 * Requires: auth + isAdmin middleware
 */
const adminUpdateProfile = async (req, res) => {
  try {
    // Validate that there's something to update
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "No update data provided" });
    }

    const admin = await Admin.findOneAndUpdate(
      { user: req.userId }, 
      req.body, 
      { new: true, runValidators: true }
    ).populate("user", "-password");
    
    if (!admin) {
      return res.status(404).json({ 
        message: "Admin profile not found",
        userId: req.userId
      });
    }
    
    res.status(200).json({ 
      message: "Admin profile updated successfully", 
      admin 
    });
  } catch (error) {
    console.error("adminUpdateProfile error:", error);
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};

module.exports = { adminUpdateProfile, getAdmin };
