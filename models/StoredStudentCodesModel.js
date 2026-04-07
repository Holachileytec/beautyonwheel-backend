const mongoose = require("mongoose");

const StoredCodes = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    isUsed: { type: Boolean, default: false },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Codes", StoredCodes);
