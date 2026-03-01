const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
    },
    password: {
      type: String,
    },

    address: {
      type: String,
      required: false,
    },
    code: {
      type: String,
    },
    passkey: {
      type: String,
    },
    role: {
      type: String,
      enum: ["superadmin", "support"],
      default: "support",
    },
  },

  {
    timestamps: true,
  },
);
module.exports = mongoose.model("Admin", adminSchema);
