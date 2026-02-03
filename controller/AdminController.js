const Admin = require("../models/AdminSchema.js");

// const User = require("./models/User");

// const createAdminIfNotFound = async () => {
//   const adminExists = await User.findOne({ role: "admin" });

//   if (!adminExists) {
//     await User.create({
//       name: "Super Admin",
//       email: "genconsolution@gmail.com",
//       password: "Gen@1949", // hash this
//       role: "admin",
//     });

//     console.log("Admin user created");
//   }
// };

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

module.exports = { adminUpdateProfile, getAdmin};
