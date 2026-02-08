const mongoose = require("mongoose");

/**
 * Chat Session Schema
 * Represents a chat conversation session between a user and AI/Human agent
 */
const chatSessionSchema = new mongoose.Schema(
  {
    // Session identifier (from client)
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // User information (optional - for identified users)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Guest user info (for non-authenticated users)
    guestInfo: {
      name: { type: String, default: null },
      email: { type: String, default: null },
      phone: { type: String, default: null },
    },

    // Current mode: 'ai' or 'human'
    mode: {
      type: String,
      enum: ["ai", "human"],
      default: "ai",
    },

    // Session status
    status: {
      type: String,
      enum: ["active", "waiting", "closed", "expired"],
      default: "active",
    },

    // Assigned agent (when in human mode)
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    // Agent info snapshot (in case agent is deleted later)
    agentInfo: {
      name: { type: String, default: null },
      email: { type: String, default: null },
      avatar: { type: String, default: null },
    },

    // Queue position (when waiting for agent)
    queuePosition: {
      type: Number,
      default: null,
    },

    // When human agent was requested
    humanRequestedAt: {
      type: Date,
      default: null,
    },

    // When agent was connected
    agentConnectedAt: {
      type: Date,
      default: null,
    },

    // Last activity timestamp
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },

    // Total messages count
    messageCount: {
      type: Number,
      default: 0,
    },

    // Client metadata
    metadata: {
      userAgent: { type: String, default: null },
      ipAddress: { type: String, default: null },
      referrer: { type: String, default: null },
      page: { type: String, default: null },
    },

    // Session tags for categorization
    tags: [{
      type: String,
    }],

    // Session rating (after close)
    rating: {
      score: { type: Number, min: 1, max: 5, default: null },
      feedback: { type: String, default: null },
      ratedAt: { type: Date, default: null },
    },

    // Session closed info
    closedAt: {
      type: Date,
      default: null,
    },

    closedBy: {
      type: String,
      enum: ["user", "agent", "system", "timeout"],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
chatSessionSchema.index({ status: 1, createdAt: -1 });
chatSessionSchema.index({ assignedAgent: 1, status: 1 });
chatSessionSchema.index({ mode: 1, status: 1 });
chatSessionSchema.index({ lastActivityAt: 1 });

// Virtual for session duration
chatSessionSchema.virtual("duration").get(function () {
  const endTime = this.closedAt || new Date();
  return endTime - this.createdAt;
});

// Virtual for wait time (time until agent connected)
chatSessionSchema.virtual("waitTime").get(function () {
  if (!this.humanRequestedAt) return null;
  const endTime = this.agentConnectedAt || new Date();
  return endTime - this.humanRequestedAt;
});

// Method to update last activity
chatSessionSchema.methods.updateActivity = function () {
  this.lastActivityAt = new Date();
  return this.save();
};

// Method to assign agent
chatSessionSchema.methods.assignAgent = function (agent) {
  this.assignedAgent = agent._id;
  this.agentInfo = {
    name: agent.name || agent.fullName,
    email: agent.email,
    avatar: agent.avatar || null,
  };
  this.mode = "human";
  this.status = "active";
  this.queuePosition = null;
  this.agentConnectedAt = new Date();
  return this.save();
};

// Method to close session
chatSessionSchema.methods.closeSession = function (closedBy = "system") {
  this.status = "closed";
  this.closedAt = new Date();
  this.closedBy = closedBy;
  return this.save();
};

// Static method to get waiting sessions
chatSessionSchema.statics.getWaitingSessions = function () {
  return this.find({ status: "waiting" })
    .sort({ humanRequestedAt: 1 })
    .populate("userId", "name email");
};

// Static method to get active sessions for an agent
chatSessionSchema.statics.getAgentSessions = function (agentId) {
  return this.find({
    assignedAgent: agentId,
    status: "active",
    mode: "human",
  }).sort({ lastActivityAt: -1 });
};

// Static method to clean up expired sessions (older than 24 hours with no activity)
chatSessionSchema.statics.cleanupExpiredSessions = async function () {
  const expiryTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.updateMany(
    {
      status: { $in: ["active", "waiting"] },
      lastActivityAt: { $lt: expiryTime },
    },
    {
      $set: {
        status: "expired",
        closedAt: new Date(),
        closedBy: "timeout",
      },
    }
  );
};

module.exports = mongoose.model("ChatSession", chatSessionSchema);
