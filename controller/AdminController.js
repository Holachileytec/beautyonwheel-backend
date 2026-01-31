const Admin = require ("../models/AdminSchema.js");

 const adminUpdateProfile = async (req, res) => {
  try {
    const admin = await Admin.findOneAndUpdate({ user: req.userId }, req.body, {
      new: true,
    });
     if (!admin) {
      console.log("error occur");

      return res.status(404).json({ message: "Admin not found" });
    }
    res.json({ message: "Admin Profile Updated", admin });
  } catch (error) {
    console.log("something went wrong", error);
    res.status(500).json({ message: "internal server error", error });
  }
};
const getAdmin = async (req, res) => {
  try {
    const admin = await Admin.findOne({ user: req.userId }).populate("user");
    res.status(200).json({ message: "Admin fetched successfully", admin });
  } catch (error) {
    console.log("something went wrong", error);
    res.status(500).json({ message: "internal server error", error });
  }
};

module.exports= {adminUpdateProfile , getAdmin}