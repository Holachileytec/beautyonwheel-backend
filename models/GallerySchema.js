const mongoose = require("mongoose") ;

const gallerySchema = new mongoose.Schema({
  beauticianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Beautician",
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  description: {
    type: String, 
    required: true,
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports= mongoose.model("Gallery", gallerySchema);
