const mongoose = require("mongoose");

const guarantorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  relationship: { type: String, required: true },
});

const beauticianSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  services: [{ type: String, required: true }],
  address: { type: String, required: true },

  // Photo uploader field for beautician profile image
  photoUploader: {
    type: String, // image URL or file path
  },
  
  // Guarantor details for verification
  guarantor: { type: guarantorSchema, required: false },
  
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
