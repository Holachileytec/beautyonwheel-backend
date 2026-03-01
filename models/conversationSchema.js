const mongoose = require("mongoose"); 

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    userType: {
      type: String,
      enum: ["client", "beautician"],
      required: true,
    },

    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",        
      required: true,
    },

    lastMessage: {
      type: String,
      default: "",
    },

    unreadCount: {
      type: Number,
      default: 0,
    },

    assignedAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,          
    },
  },
  {
    timestamps: true,         
  }
);

module.exports = mongoose.model("Conversation", conversationSchema);
