const ChatSession = require("../models/ChatSessionSchema");
const ChatMessage = require("../models/ChatMessageSchema");
const Admin = require("../models/AdminSchema");

/**
 * Chat Controller
 * Handles REST API endpoints for chat functionality
 */

// Create a new chat session
const createSession = async (req, res) => {
  try {
    const { sessionId, userId, guestInfo, metadata } = req.body;

    // Check if session already exists
    let session = await ChatSession.findOne({ sessionId });

    if (session) {
      // Reactivate if closed/expired
      if (session.status === "closed" || session.status === "expired") {
        session.status = "active";
        session.mode = "ai";
        session.closedAt = null;
        session.closedBy = null;
        session.lastActivityAt = new Date();
        await session.save();
      }
      return res.status(200).json({
        success: true,
        message: "Session retrieved",
        data: session,
      });
    }

    // Create new session
    session = new ChatSession({
      sessionId,
      userId: userId || null,
      guestInfo: guestInfo || {},
      metadata: metadata || {},
      status: "active",
      mode: "ai",
    });

    await session.save();

    res.status(201).json({
      success: true,
      message: "Session created",
      data: session,
    });
  } catch (error) {
    console.error("Create session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create session",
      error: error.message,
    });
  }
};

// Get session by ID
const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ChatSession.findOne({ sessionId })
      .populate("userId", "name email phone")
      .populate("assignedAgent", "name email");

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error("Get session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get session",
      error: error.message,
    });
  }
};

// Get session messages
const getSessionMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50, before, after } = req.query;

    const messages = await ChatMessage.getSessionMessages(sessionId, {
      limit: parseInt(limit),
      before,
      after,
    });

    // Reverse to get chronological order
    messages.reverse();

    res.status(200).json({
      success: true,
      data: messages,
      count: messages.length,
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get messages",
      error: error.message,
    });
  }
};

// Save a message (for persistence)
const saveMessage = async (req, res) => {
  try {
    const {
      sessionId,
      messageId,
      text,
      sender,
      senderName,
      userId,
      agentId,
      messageType,
      attachments,
      quickReplies,
      aiMetadata,
      clientTimestamp,
    } = req.body;

    // Verify session exists
    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Create message
    const message = new ChatMessage({
      sessionId,
      messageId,
      text,
      sender,
      senderName,
      userId,
      agentId,
      messageType: messageType || "text",
      attachments: attachments || [],
      quickReplies: quickReplies || [],
      aiMetadata: aiMetadata || {},
      clientTimestamp: clientTimestamp ? new Date(clientTimestamp) : null,
    });

    await message.save();

    // Update session
    session.messageCount += 1;
    session.lastActivityAt = new Date();
    await session.save();

    res.status(201).json({
      success: true,
      message: "Message saved",
      data: message,
    });
  } catch (error) {
    console.error("Save message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save message",
      error: error.message,
    });
  }
};
const getAllSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find()
      .populate("userId", "name email")
      .populate("assignedAgent", "name email")
      .sort({ lastActivityAt: -1 });

    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// const getAllSessions = async (req, res) => {
//   try {
//     const { status, mode, page = 1, limit = 20 } = req.query;

//     let filter = {};
//     if (status) filter.status = status;
//     if (mode) filter.mode = mode;

//     const sessions = await ChatSession.find(filter)
//       .populate("userId", "name email")
//       .populate("assignedAgent", "name email")
//       .sort({ lastActivityAt: -1 })
//       .skip((page - 1) * limit)
//       .limit(parseInt(limit));

//     const total = await ChatSession.countDocuments(filter);

//     res.status(200).json({
//       success: true,
//       data: sessions,
//       pagination: {
//         total,
//         page: parseInt(page),
//         pages: Math.ceil(total / limit),
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// Request human agent
const requestHumanAgent = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userInfo } = req.body;

    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Update session status
    session.status = "waiting";
    session.humanRequestedAt = new Date();

    // Update guest info if provided
    if (userInfo) {
      session.guestInfo = {
        ...session.guestInfo,
        ...userInfo,
      };
    }

    // Calculate queue position
    const waitingCount = await ChatSession.countDocuments({
      status: "waiting",
      humanRequestedAt: { $lt: session.humanRequestedAt },
    });
    session.queuePosition = waitingCount + 1;

    await session.save();

    res.status(200).json({
      success: true,
      message: "Human agent requested",
      data: {
        sessionId: session.sessionId,
        queuePosition: session.queuePosition,
        status: session.status,
      },
    });
  } catch (error) {
    console.error("Request human agent error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to request human agent",
      error: error.message,
    });
  }
};

// Close session
const closeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { closedBy = "user", rating } = req.body;

    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    session.status = "closed";
    session.closedAt = new Date();
    session.closedBy = closedBy;

    if (rating) {
      session.rating = {
        score: rating.score,
        feedback: rating.feedback,
        ratedAt: new Date(),
      };
    }

    await session.save();

    res.status(200).json({
      success: true,
      message: "Session closed",
      data: session,
    });
  } catch (error) {
    console.error("Close session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to close session",
      error: error.message,
    });
  }
};

// ============ AGENT ENDPOINTS ============

// Get all waiting sessions (for agent dashboard)
const getWaitingSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.getWaitingSessions();

    res.status(200).json({
      success: true,
      data: sessions,
      count: sessions.length,
    });
  } catch (error) {
    console.error("Get waiting sessions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get waiting sessions",
      error: error.message,
    });
  }
};

// Get agent's active sessions
const getAgentSessions = async (req, res) => {
  try {
    const agentId = req.user._id; // From auth middleware

    const sessions = await ChatSession.getAgentSessions(agentId);

    res.status(200).json({
      success: true,
      data: sessions,
      count: sessions.length,
    });
  } catch (error) {
    console.error("Get agent sessions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get agent sessions",
      error: error.message,
    });
  }
};

// Assign session to agent
const assignSessionToAgent = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const agent = req.user; // From auth middleware

    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    if (session.status !== "waiting" && session.mode !== "ai") {
      return res.status(400).json({
        success: false,
        message: "Session is not available for assignment",
      });
    }

    await session.assignAgent(agent);

    // Update queue positions for other waiting sessions
    await ChatSession.updateMany(
      {
        status: "waiting",
        queuePosition: { $gt: session.queuePosition || 0 },
      },
      { $inc: { queuePosition: -1 } },
    );

    res.status(200).json({
      success: true,
      message: "Session assigned",
      data: session,
    });
  } catch (error) {
    console.error("Assign session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign session",
      error: error.message,
    });
  }
};

// Transfer session to another agent
const transferSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { targetAgentId } = req.body;

    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Get target agent info (you'd need to import Admin model)
    // For now, just update the ID
    session.assignedAgent = targetAgentId;
    session.lastActivityAt = new Date();
    await session.save();

    res.status(200).json({
      success: true,
      message: "Session transferred",
      data: session,
    });
  } catch (error) {
    console.error("Transfer session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to transfer session",
      error: error.message,
    });
  }
};

// Get chat statistics (for admin dashboard)
const getChatStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const stats = await ChatSession.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          activeSessions: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          waitingSessions: {
            $sum: { $cond: [{ $eq: ["$status", "waiting"] }, 1, 0] },
          },
          closedSessions: {
            $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] },
          },
          aiSessions: {
            $sum: { $cond: [{ $eq: ["$mode", "ai"] }, 1, 0] },
          },
          humanSessions: {
            $sum: { $cond: [{ $eq: ["$mode", "human"] }, 1, 0] },
          },
          avgMessageCount: { $avg: "$messageCount" },
          avgRating: { $avg: "$rating.score" },
        },
      },
    ]);

    const messageStats = await ChatMessage.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$sender",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        sessions: stats[0] || {
          totalSessions: 0,
          activeSessions: 0,
          waitingSessions: 0,
          closedSessions: 0,
          aiSessions: 0,
          humanSessions: 0,
          avgMessageCount: 0,
          avgRating: null,
        },
        messages: messageStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error("Get chat stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get chat stats",
      error: error.message,
    });
  }
};

// Cleanup expired sessions (called by cron job or manually)
const cleanupExpiredSessions = async (req, res) => {
  try {
    const result = await ChatSession.cleanupExpiredSessions();

    res.status(200).json({
      success: true,
      message: "Cleanup completed",
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cleanup sessions",
      error: error.message,
    });
  }
};

module.exports = {
  // User endpoints
  createSession,
  getSession,
  getSessionMessages,
  saveMessage,
  requestHumanAgent,
  closeSession,

  // Agent endpoints
  getWaitingSessions,
  getAgentSessions,
  assignSessionToAgent,
  transferSession,

  // Admin endpoints
  getChatStats,
  cleanupExpiredSessions,
  getAllSessions,
};
