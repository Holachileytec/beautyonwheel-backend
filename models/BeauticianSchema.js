const mongoose = require("mongoose");

const beauticianSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  services: [{ type: String, required: true }],
  address: { type: String, required: true },
  gender: { type: String },
  // Guarantor
  guarantorName: { type: String },
  guarantorAddress: { type: String },
  guarantorPhone: { type: String },
  guarantorRelationship: { type: String },
  // Photo uploader field for beautician profile image
  photoUploader: {
    type: String, // image URL or file path
  },

  // User preference
  bio: { type: String, default: "" },
  rating: { type: Number, default: 0 },
  experienceYears: { type: Number, default: 0 },
  specialties: { type: [String], default: [] },
  notification: { type: Boolean, default: true },
  theme: {
    type: String,
    enum: ["dark", "light"],
    default: "light",
    lowercase: true,
  },
});

module.exports = mongoose.model("Beautician", beauticianSchema);
