const mongoose = require("mongoose"); 

const messageSchema = new mongoose.Schema( 
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,  
      refPath: "senderType",                 
      required: true,
    },

    senderType: {
      type: String,
      enum: ["client", "beautician", "admin"],
      required: true,
    },

    message: {
      type: String,
      required: true,
      maxlength: 5000,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,                        
    },

    messageType: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",                      
    },

    isDeleted: {
      type: Boolean,
      default: false,                       
    },
  },
  {
    timestamps: true,                       
  }
);

// Indexes for fast queries
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ senderId: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema); 
