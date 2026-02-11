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

// Public routes
router.post("/signup", registerUser);
router.post("/login", loginUser);

// Protected routes
router.get("/getAllUsers", auth, getAllUsers);
router.get("/:id", auth, getSingleUser);
router.put("/:id", auth, updateUser);
router.put("/userUpdate/:id", auth, updateUser);
router.delete("/delete/:id", auth, deleteUser);

module.exports = router;
