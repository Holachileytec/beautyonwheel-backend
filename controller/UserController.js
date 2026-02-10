const express = require("express");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/UserSchema.js");
const Client = require("../models/ClientSchema.js");
const Beautician = require("../models/BeauticianSchema.js");
const Admin = require("../models/AdminSchema.js");

// User Registration ....Route.Post("/api/users/register"), 1. endpoint

const registerUser = async (req, res) => {
  console.log("hit user api");
  const { name, email, password, role, phone } = req.body;

  // veryfiying all the field to be filled
  try {
    if (!name || !email || !password || !role || !phone) {
      return res.status(400).json({ message: "All fields required" });
    }
    // checking if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }
    // hasahed password
    const hashedPassword = await bcrypt.hash(password, 10); // hashing pwd with bcrypt

    // creating new user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
    });

    // create linked profile base on a role
    let profile = null;

    if (role.toLowerCase() === "client") {
      profile = await Client.create({
        user: newUser._id,
        favouriteService: [],
        theme: "light",
        notification: "true",
      });
    } else if (role.toLowerCase() === "beautician") {
      profile = await Beautician.create({
        user: newUser._id,
        address: "unknown",
        bio: "",
        rating: 0,
        experienceYears: 0,
        specialties: "",
        notification: true,
        theme: "light",
      });
    } else if (role.toLowerCase() === "admin") {
      profile = await Admin.create({
        user: newUser._id,
        address: "",
      });
    } else {
      return res.status(400).json({ message: "This role does not exist" });
    }
    res.status(201).json({
      message: "User registered successfully",
      newUser,
      profile: profile || null,
    });
  } catch (error) {
    console.log(`Register error ${error}`);

    res
      .status(500)
      .json({ message: "something went wrong", error: error.message });
  }
};
// User Login ....Route.Post("/api/users/login"), 2. endpoint
const loginUser = async (req, res) => {
  console.log("hit login api");
  try {
    const { email, password } = req.body; // destructuring login req.body

    if (!email || !password) {
      return res.status(400).json({
        message: "All fields required!",
      });
    }

    // checking if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "User does not exist" });
    }

    // comparing pwd with hashed pwd
    const isPasswordOk = await bcrypt.compare(password, user.password);
    if (!isPasswordOk) {
      console.log("sorry invalid credentials..Access Denied!");
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }
    // generating jwt token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.Jwt_SECRET,
      {
        // generating jwt token
        expiresIn: "7d",
      },
    );

    const { password: userHashedPassword, ...rest } = user._doc;
    res.status(200).json({ message: "login successfully", token, user: rest });
  } catch (error) {
    console.log(`Login error: ${error}`);
    res
      .status(500)
      .json({ message: "something went wrong", error: error.message });
  }
};

// get all users // getUser ....Route.Get("/api/users/getAllUsers"), 3. endpoint admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res
      .status(200)
      .json({ message: `All Users fetched successfully, `, users });
  } catch (error) {
    res.staus(500).json({ message: "failed to fetched the Users", error });
  }
};

// singleUser ....Route.Get("/api/users/getSingleUser/:id"), 4. endpoint
const getSingleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User feteched succssfully", user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "failed to fetched user", error: error.message });
  }
};

// updateUser ....Route.Put("/api/users/updateUser/:id"), 5. endpoint
const updateUser = async (req, res) => {
  try {
    const { name, email, phone, role, password } = req.body;
    const user = await User.findById(req.params.id);

    // check if user exists
    if (!user) {
      res.status(440).json({ message: "User not Found" });
    }

    // update password if provided
    if (password && password.trim() != "") {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    // update other fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.role = role || user.role;
    await user.save();
    res.status(200).json({ message: "User updated successfuly", user });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "failed to update user", error });
  }
};

//delete user
// deleteUser ....Route.delete("/api/users/:id"), 6. endpoint
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
    }
    res.status(201).json({ message: "User deleted sucessfully" });
  } catch (error) {
    res.status(500).json({ message: "failed to delete user", error });
  }
};

module.exports = {
  deleteUser,
  updateUser,
  getAllUsers,
  getSingleUser,
  loginUser,
  registerUser,
};
