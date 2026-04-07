const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    membership: {
      type: {
        type: String,
        enum: ["none", "normal", "vip", "vvip"],
        default: "none",
      },
      startDate: { type: Date },
      expiryDate: { type: Date },
      isActive: { type: Boolean, default: false },
    },

    role: {
      type: String,
      enum: ["beautician", "client", "admin"],
      default: "client",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
