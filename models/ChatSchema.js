const mongoose = require("mongoose") ;

const chatSchema = new mongoose.Schema(
  {
    beauticianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
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
