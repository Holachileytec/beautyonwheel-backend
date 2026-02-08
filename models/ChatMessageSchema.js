const mongoose = require("mongoose");

/**
 * Chat Message Schema
 * Represents individual messages in a chat session
 */
const chatMessageSchema = new mongoose.Schema(
  {
    // Reference to the chat session
    sessionId: {
      type: String,
      required: true,
      index: true,
    },

    // Message unique identifier (from client)
    messageId: {
      type: String,
      required: true,
      unique: true,
    },

    // Message content
    text: {
      type: String,
      required: true,
      maxlength: 5000,
    },

    // Sender type: 'user', 'ai', 'human', 'system'
    sender: {
      type: String,
      enum: ["user", "ai", "human", "system"],
      required: true,
    },

    // Sender name (for display)
    senderName: {
      type: String,
      default: null,
    },

    // For user messages - user reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // For human agent messages - agent reference
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    // Message status
    status: {
      type: String,
      enum: ["sent", "delivered", "read", "failed"],
      default: "sent",
    },

    // Read timestamp
    readAt: {
      type: Date,
      default: null,
    },

    // Message type for special content
    messageType: {
      type: String,
      enum: ["text", "image", "file", "quick_reply", "system_event"],
      default: "text",
    },

    // Attachments (for images/files)
    attachments: [{
      type: { type: String },
      url: { type: String },
      name: { type: String },
      size: { type: Number },
    }],

    // Quick reply options (for AI suggestions)
    quickReplies: [{
      label: { type: String },
      value: { type: String },
    }],

    // AI metadata (for AI responses)
    aiMetadata: {
      category: { type: String, default: null },
      confidence: { type: Number, default: null },
      action: { type: String, default: null },
      responseTime: { type: Number, default: null },
    },

    // Client-side timestamp
    clientTimestamp: {
      type: Date,
      default: null,
    },

    // Whether message was edited
    isEdited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
      default: null,
    },

    // Whether message was deleted (soft delete)
    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
chatMessageSchema.index({ sessionId: 1, createdAt: 1 });
chatMessageSchema.index({ sender: 1, createdAt: -1 });
chatMessageSchema.index({ agentId: 1, createdAt: -1 });

// Virtual for formatted timestamp
chatMessageSchema.virtual("formattedTime").get(function () {
  return this.createdAt.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
});

// Method to mark as read
chatMessageSchema.methods.markAsRead = function () {
  if (this.status !== "read") {
    this.status = "read";
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to soft delete
chatMessageSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Static method to get messages for a session
chatMessageSchema.statics.getSessionMessages = function (
  sessionId,
  options = {}
) {
  const { limit = 50, before = null, after = null } = options;

  let query = this.find({
    sessionId,
    isDeleted: false,
  });

  if (before) {
    query = query.where("createdAt").lt(new Date(before));
  }

  if (after) {
    query = query.where("createdAt").gt(new Date(after));
  }

  return query.sort({ createdAt: -1 }).limit(limit);
};

// Static method to mark all messages in session as read
chatMessageSchema.statics.markSessionAsRead = function (sessionId, sender) {
  return this.updateMany(
    {
      sessionId,
      sender: { $ne: sender },
      status: { $ne: "read" },
    },
    {
      $set: {
        status: "read",
        readAt: new Date(),
      },
    }
  );
};

// Static method to get unread count for a session
chatMessageSchema.statics.getUnreadCount = function (sessionId, forSender) {
  return this.countDocuments({
    sessionId,
    sender: { $ne: forSender },
    status: { $ne: "read" },
    isDeleted: false,
  });
};

// Static method to get message statistics
chatMessageSchema.statics.getSessionStats = async function (sessionId) {
  const stats = await this.aggregate([
    { $match: { sessionId, isDeleted: false } },
    {
      $group: {
        _id: "$sender",
        count: { $sum: 1 },
        avgLength: { $avg: { $strLenCP: "$text" } },
      },
    },
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = {
      count: stat.count,
      avgLength: Math.round(stat.avgLength),
    };
    return acc;
  }, {});
};

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
