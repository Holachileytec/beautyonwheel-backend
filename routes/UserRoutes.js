// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const {
  deleteUser,
  updateUser,
  getAllUsers,
  getSingleUser,
  loginUser,
  registerUser,
} = require("../controller/UserController.js");
const auth = require("../middleware/authMiddleware.js");

// Public
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected
router.get("/all", auth, getAllUsers);
router.get("/single/:id", auth, getSingleUser);
router.put("/update/:id", auth, updateUser);
router.delete("/delete/:id", auth, deleteUser);

module.exports = router;
