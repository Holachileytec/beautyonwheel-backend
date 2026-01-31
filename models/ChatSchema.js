const mongoose = require("mongoose") ;

const chatSchema = new mongoose.Schema(
  {
    beauticianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "beautician",
      required: true,
    },

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "client",
      required: true,
    },

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admin",
      required: true,
    },

    type: String,
    sender: String,
    reciever: String,
  },
  {
    timestamps: true,
  }
);
module.exports= mongoose.model("Chat", chatSchema);
