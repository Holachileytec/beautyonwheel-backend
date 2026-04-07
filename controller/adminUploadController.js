const Admin = require ("../models/AdminSchema.js");

//controller for admin to upload image to local server

const handleAdminUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    res.json({
      message: "Upload successful",
      filename: req.file.filename,
      path: "/uploads/admin/" + req.file.filename,
    });
  } catch (error) {
    console.log("something went wrong during admin upload", error);
    res.status(500).json({ message: "internal server error", error });
  }
};
module.exports= {handleAdminUpload}; 
