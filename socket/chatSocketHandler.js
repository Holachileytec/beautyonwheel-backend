const ChatSession = require("../models/ChatSessionSchema");
const ChatMessage = require("../models/ChatMessageSchema");
// At the top of the file with other requires
const Admin = require("../models/AdminSchema");

/**
 * Chat Socket Handler
 * Manages real-time chat communication via Socket.io
 */

// Store active connections
const activeConnections = new Map(); // sessionId -> socket
const agentConnections = new Map(); // agentId -> socket
const agentSessions = new Map(); // agentId -> Set of sessionIds

/**
 * Initialize chat socket handlers
 * @param {Server} io - Socket.io server instance
 */
function initializeChatSocket(io) {
  // Create chat namespace
  const chatNamespace = io.of("/chat");

  chatNamespace.on("connection", (socket) => {
    console.log(`Chat socket connected: ${socket.id}`);

    const { sessionId, agentId, isAgent } = socket.handshake.auth;

    if (isAgent && agentId) {
      handleAgentConnection(socket, agentId, chatNamespace);
    } else if (sessionId) {
      handleUserConnection(socket, sessionId, chatNamespace);
    } else {
      console.log("Connection rejected: missing sessionId or agentId");
      socket.disconnect(true);
      return;
    }

    // Common event handlers
    setupCommonHandlers(socket, chatNamespace);
  });

  // Cleanup interval - check for stale connections every 5 minutes
  setInterval(
    () => {
      cleanupStaleConnections(chatNamespace);
    },
    5 * 60 * 1000,
  );

  return chatNamespace;
}

/**
 * Handle user (customer) connection
 */
function handleUserConnection(socket, sessionId, namespace) {
  console.log(`User connected: sessionId=${sessionId}`);

  // Store connection
  activeConnections.set(sessionId, socket);
  socket.sessionId = sessionId;
  socket.isAgent = false;

  // Join session room
  socket.join(`session:${sessionId}`);

  // Initialize or get session
  initializeSession(socket, sessionId);

  // User-specific event handlers
  socket.on("user:message", (data) =>
    handleUserMessage(socket, data, namespace),
  );
  socket.on("user:typing", (data) => handleUserTyping(socket, data, namespace));
  socket.on("user:requestAgent", (data) =>
    handleRequestAgent(socket, data, namespace),
  );
  socket.on("user:endHumanChat", (data) =>
    handleEndHumanChat(socket, data, namespace),
  );
  socket.on("user:updateInfo", (data) => handleUpdateUserInfo(socket, data));

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`User disconnected: sessionId=${sessionId}`);
    activeConnections.delete(sessionId);

    // Notify assigned agent if any
    notifyAgentOfUserStatus(sessionId, "offline", namespace);
  });
}

/**
 * Handle agent (support staff) connection
 */
function handleAgentConnection(socket, agentId, namespace) {
  console.log(`Agent connected: agentId=${agentId}`);

  // Store connection
  agentConnections.set(agentId, socket);
  socket.agentId = agentId;
  socket.isAgent = true;

  // Initialize agent sessions set
  if (!agentSessions.has(agentId)) {
    agentSessions.set(agentId, new Set());
  }

  // Join agent room
  socket.join(`agent:${agentId}`);
  socket.join("agents"); // All agents room

  // Send current waiting queue
  sendWaitingQueue(socket);

  // Send agent's active sessions
  sendAgentActiveSessions(socket, agentId);

  // Agent-specific event handlers
  socket.on("agent:message", (data) =>
    handleAgentMessage(socket, data, namespace),
  );
  socket.on("agent:typing", (data) =>
    handleAgentTyping(socket, data, namespace),
  );
  socket.on("agent:acceptSession", (data) =>
    handleAcceptSession(socket, data, namespace),
  );

  socket.on("agent:closeSession", (data) =>
    handleCloseSession(socket, data, namespace),
  );
  socket.on("agent:leaveSession", (data) =>
    handleAgentLeaveSession(socket, data, namespace),
  );
  socket.on("agent:transferSession", (data) =>
    handleTransferSession(socket, data, namespace),
  );
  async function handleCloseSession(socket, data, namespace) {
    try {
      const { sessionId } = data;
      const agentId = socket.agentId;

      const session = await ChatSession.findOne({ sessionId });
      if (!session || session.assignedAgent?.toString() !== agentId) {
        socket.emit("error", { message: "Not authorized" });
        return;
      }

      // Close the session
      await session.closeSession("agent");

      // Remove from agent tracking
      const sessions = agentSessions.get(agentId);
      if (sessions) sessions.delete(sessionId);

      socket.leave(`session:${sessionId}`);

      // Notify user
      const userSocket = activeConnections.get(sessionId);
      if (userSocket) {
        userSocket.emit("session:closed", {
          message: "Session closed by agent",
        });
      }

      socket.emit("session:closed", { sessionId });

      // Update all agents
      namespace.to("agents").emit("session:removed", { sessionId });
    } catch (error) {
      console.error("Handle close session error:", error);
      socket.emit("error", { message: "Failed to close session" });
    }
  }

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`Agent disconnected: agentId=${agentId}`);
    agentConnections.delete(agentId);

    // Notify all active sessions
    const sessions = agentSessions.get(agentId);
    if (sessions) {
      sessions.forEach((sessionId) => {
        notifyUserOfAgentStatus(sessionId, null, namespace);
      });
    }
    agentSessions.delete(agentId);
  });

  // Restore in-memory session tracking from DB on reconnect
  ChatSession.find({
    assignedAgent: agentId,
    mode: "human",
    status: "active",
  }).then((sessions) => {
    const sessionSet = agentSessions.get(agentId) || new Set();
    sessions.forEach((s) => {
      sessionSet.add(s.sessionId);
      socket.join(`session:${s.sessionId}`); // ← rejoin rooms!
    });
    agentSessions.set(agentId, sessionSet);

    // Notify clients their agent is back
    sessions.forEach((s) => {
      const userSocket = activeConnections.get(s.sessionId);
      if (userSocket) {
        userSocket.emit("agent:connected", s.agentInfo);
      }
    });
  });
}

/**
 * Setup common event handlers
 */
function setupCommonHandlers(socket, namespace) {
  socket.on("ping", () => {
    socket.emit("pong", { timestamp: Date.now() });
  });

  socket.on("error", (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
}

// ============ USER EVENT HANDLERS ============

async function initializeSession(socket, sessionId) {
  try {
    let session = await ChatSession.findOne({ sessionId });

    if (!session) {
      // Create new session
      session = new ChatSession({
        sessionId,
        status: "active",
        mode: "ai",
      });
      await session.save();
    } else if (session.status === "closed" || session.status === "expired") {
      // Reactivate session
      session.status = "active";
      session.mode = "ai";
      session.closedAt = null;
      session.closedBy = null;
      session.lastActivityAt = new Date();
      await session.save();
    }

    // If session has assigned agent, check if agent is online
    if (session.assignedAgent && session.mode === "human") {
      const agentSocket = agentConnections.get(
        session.assignedAgent.toString(),
      );
      if (agentSocket) {
        socket.emit("agent:connected", session.agentInfo);
        agentSocket.emit("user:reconnected", { sessionId });
      } else {
        // Agent is temporarily offline — DON'T wipe assignment yet
        // Just notify the user and keep the session intact
        socket.emit("agent:temporarily_unavailable", {
          message: "Your agent is temporarily unavailable, please wait...",
          agentInfo: session.agentInfo, // still show who their agent is
        });

        // Optionally set a grace period before switching to AI
        setTimeout(async () => {
          const freshSession = await ChatSession.findOne({ sessionId });
          // Only switch to AI if agent STILL hasn't reconnected
          if (
            freshSession?.mode === "human" &&
            !agentConnections.has(freshSession.assignedAgent?.toString())
          ) {
            freshSession.mode = "ai";
            freshSession.assignedAgent = null;
            freshSession.agentInfo = { name: null, email: null, avatar: null };
            await freshSession.save();
            socket.emit("mode:changed", { mode: "ai" });
          }
        }, 30000); // 30 second grace period
      }
    }

    socket.emit("session:initialized", {
      sessionId: session.sessionId,
      mode: session.mode,
      status: session.status,
      agentInfo: session.agentInfo,
    });
  } catch (error) {
    console.error("Initialize session error:", error);
    socket.emit("error", { message: "Failed to initialize session" });
  }
}

async function handleUserMessage(socket, data, namespace) {
  
  try {
    const { sessionId, message } = data;

    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      socket.emit("error", { message: "Session not found" });
      return;
    }

    // Save message
    const chatMessage = new ChatMessage({
      sessionId,
      messageId: message.id || `msg_${Date.now()}`,
      text: message.text,
      sender: "user",
      senderName: session.guestInfo?.name || "User",
      clientTimestamp: message.timestamp ? new Date(message.timestamp) : null,
    });

    await chatMessage.save();

    // Update session activity
    session.messageCount += 1;
    session.lastActivityAt = new Date();
    await session.save();

    const formattedMessage = {
      id: chatMessage.messageId,
      text: chatMessage.text,
      sender: "user",
      senderName: chatMessage.senderName,
      timestamp: chatMessage.createdAt.toISOString(),
    };

    /**
     * 🔥 Forward message to assigned agent (if exists)
     * DO NOT block by mode — only check assignedAgent
     */
    if (session.assignedAgent) {
      const agentSocket = agentConnections.get(
        session.assignedAgent.toString(),
      );

      if (agentSocket) {
        agentSocket.emit("user:message", {
          sessionId,
          message: formattedMessage,
        });
      }
    }

    // Optional: notify all agents if session is still waiting
    if (session.status === "waiting") {
      namespace.to("agents").emit("queue:messageUpdate", {
        sessionId,
        message: formattedMessage,
      });
    }

    // Acknowledge back to user
    socket.emit("message:delivered", {
      messageId: chatMessage.messageId,
      timestamp: chatMessage.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Handle user message error:", error);
    socket.emit("error", { message: "Failed to send message" });
  }
}

async function handleUserTyping(socket, data, namespace) {
  try {
    const { sessionId, isTyping } = data;
    const session = await ChatSession.findOne({ sessionId });

    if (session?.mode === "human" && session.assignedAgent) {
      const agentSocket = agentConnections.get(
        session.assignedAgent.toString(),
      );
      if (agentSocket) {
        agentSocket.emit("user:typing", { sessionId, isTyping });
      }
    }
  } catch (error) {
    console.error("Handle typing error:", error);
  }
}

async function handleRequestAgent(socket, data, namespace) {
  try {
    const { sessionId, userInfo } = data;
    const session = await ChatSession.findOne({ sessionId });

    if (!session) {
      socket.emit("error", { message: "Session not found" });
      return;
    }

    // Update session
    session.status = "waiting";
    session.humanRequestedAt = new Date();

    if (userInfo) {
      session.guestInfo = { ...session.guestInfo, ...userInfo };
      session.userType = userInfo.userType || null;
    }

    // Calculate queue position
    const waitingCount = await ChatSession.countDocuments({
      status: "waiting",
      humanRequestedAt: { $lt: session.humanRequestedAt },
    });
    session.queuePosition = waitingCount + 1;

    await session.save();

    // Notify user
    socket.emit("queue:position", session.queuePosition);

    // Notify all agents about new waiting session
    namespace.to("agents").emit("queue:newSession", {
      sessionId: session.sessionId,
      guestInfo: session.guestInfo,
      queuePosition: session.queuePosition,
      requestedAt: session.humanRequestedAt,
    });

    console.log(
      `Agent requested for session ${sessionId}, queue position: ${session.queuePosition}`,
    );
  } catch (error) {
    console.error("Handle request agent error:", error);
    socket.emit("error", { message: "Failed to request agent" });
  }
}

async function handleEndHumanChat(socket, data, namespace) {
  try {
    const { sessionId } = data;
    const session = await ChatSession.findOne({ sessionId });

    if (!session) return;

    const previousAgentId = session.assignedAgent?.toString();

    // Switch back to AI mode
    session.mode = "ai";
    session.assignedAgent = null;
    session.agentInfo = { name: null, email: null, avatar: null };
    session.status = "active";
    await session.save();

    // Notify agent
    if (previousAgentId) {
      const agentSocket = agentConnections.get(previousAgentId);
      if (agentSocket) {
        agentSocket.emit("session:ended", { sessionId });

        // Remove from agent's sessions
        const sessions = agentSessions.get(previousAgentId);
        if (sessions) sessions.delete(sessionId);
      }
    }

    socket.emit("mode:changed", { mode: "ai" });
  } catch (error) {
    console.error("Handle end human chat error:", error);
  }
}

async function handleUpdateUserInfo(socket, data) {
  try {
    const { sessionId, userInfo } = data;

    await ChatSession.findOneAndUpdate(
      { sessionId },
      { $set: { guestInfo: userInfo, lastActivityAt: new Date() } },
    );
  } catch (error) {
    console.error("Handle update user info error:", error);
  }
}

// ============ AGENT EVENT HANDLERS ============

async function sendWaitingQueue(socket) {
  try {
    const waitingSessions = await ChatSession.find({ status: "waiting" })
      .sort({ humanRequestedAt: 1 })
      .select(
        "sessionId guestInfo queuePosition humanRequestedAt messageCount userType",
      );

    socket.emit("queue:list", waitingSessions);
  } catch (error) {
    console.error("Send waiting queue error:", error);
  }
}

async function sendAgentActiveSessions(socket, agentId) {
  try {
    const sessions = await ChatSession.find({
      assignedAgent: agentId,
      status: "active",
      mode: "human",
    }).select("sessionId guestInfo lastActivityAt messageCount");

    socket.emit("sessions:active", sessions);

    // Update local tracking
    const sessionSet = agentSessions.get(agentId) || new Set();
    sessions.forEach((s) => sessionSet.add(s.sessionId));
    agentSessions.set(agentId, sessionSet);
  } catch (error) {
    console.error("Send agent active sessions error:", error);
  }
}

async function handleAgentMessage(socket, data, namespace) {
  try {
    const { sessionId, message } = data;
    const agentId = socket.agentId;

    const session = await ChatSession.findOne({ sessionId });
    if (!session || session.assignedAgent?.toString() !== agentId) {
      socket.emit("error", { message: "Not authorized for this session" });
      return;
    }

    // Save message
    const chatMessage = new ChatMessage({
      sessionId,
      messageId: message.id || `msg_${Date.now()}`,
      text: message.text,
      sender: "human",
      senderName: session.agentInfo?.name || "Support Agent",
      agentId,
    });
    await chatMessage.save();

    // Update session
    session.messageCount += 1;
    session.lastActivityAt = new Date();
    await session.save();

    // Forward to user
    const userSocket = activeConnections.get(sessionId);
    if (userSocket) {
      userSocket.emit("agent:message", {
        id: chatMessage.messageId,
        text: message.text,
        sender: "human",
        senderName: session.agentInfo?.name,
        timestamp: chatMessage.createdAt.toISOString(),
      });
    }

    // Acknowledge
    socket.emit("message:delivered", {
      messageId: chatMessage.messageId,
      sessionId,
    });
  } catch (error) {
    console.error("Handle agent message error:", error);
    socket.emit("error", { message: "Failed to send message" });
  }
}

async function handleAgentTyping(socket, data, namespace) {
  try {
    const { sessionId, isTyping } = data;

    const userSocket = activeConnections.get(sessionId);
    if (userSocket) {
      userSocket.emit("agent:typing", isTyping);
    }
  } catch (error) {
    console.error("Handle agent typing error:", error);
  }
}

async function handleAcceptSession(socket, data, namespace) {
  try {
    const { sessionId } = data;
    const agentId = socket.agentId;

    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      socket.emit("error", { message: "Session not found" });
      return;
    }

    if (session.status !== "waiting") {
      socket.emit("error", { message: "Session is no longer waiting" });
      return;
    }

    // Get agent info (simplified - you'd get this from Admin model)
    const agent = await Admin.findById(agentId).select("name email avatar");
    if (!agent) {
      socket.emit("error", { message: "Agent not found" });
      return;
    }

    const agentInfo = {
      name: agent.name,
      email: agent.email,
      avatar: agent.avatar || null,
    };

    // Update session
    const oldQueuePosition = session.queuePosition;
    session.assignedAgent = agentId;
    session.agentInfo = agentInfo;
    session.mode = "human";
    session.status = "active";
    session.queuePosition = null;
    session.agentConnectedAt = new Date();
    await session.save();

    // Update queue positions for other waiting sessions
    await ChatSession.updateMany(
      { status: "waiting", queuePosition: { $gt: oldQueuePosition } },
      { $inc: { queuePosition: -1 } },
    );

    // Add to agent's sessions
    const sessions = agentSessions.get(agentId) || new Set();
    sessions.add(sessionId);
    agentSessions.set(agentId, sessions);

    // Join session room
    socket.join(`session:${sessionId}`);

    // Notify user
    const userSocket = activeConnections.get(sessionId);
    if (userSocket) {
      userSocket.emit("agent:connected", agentInfo);
    }

    // Notify agent
    socket.emit("session:accepted", {
      sessionId,
      guestInfo: session.guestInfo,
    });

    // Update queue for all agents
    namespace.to("agents").emit("queue:sessionRemoved", { sessionId });

    console.log(`Agent ${agentId} accepted session ${sessionId}`);
  } catch (error) {
    console.error("Handle accept session error:", error);
    socket.emit("error", { message: "Failed to accept session" });
  }
}

async function handleAgentLeaveSession(socket, data, namespace) {
  try {
    const { sessionId } = data;
    const agentId = socket.agentId;

    const session = await ChatSession.findOne({ sessionId });
    if (!session || session.assignedAgent?.toString() !== agentId) {
      return;
    }

    // Switch session back to AI mode
    session.mode = "ai";
    session.assignedAgent = null;
    session.agentInfo = { name: null, email: null, avatar: null };
    await session.save();

    // Remove from agent's sessions
    const sessions = agentSessions.get(agentId);
    if (sessions) sessions.delete(sessionId);

    // Leave session room
    socket.leave(`session:${sessionId}`);

    // Notify user
    const userSocket = activeConnections.get(sessionId);
    if (userSocket) {
      userSocket.emit("agent:disconnected");
    }

    socket.emit("session:left", { sessionId });
  } catch (error) {
    console.error("Handle agent leave session error:", error);
  }
}

async function handleTransferSession(socket, data, namespace) {
  try {
    const { sessionId, targetAgentId } = data;
    const currentAgentId = socket.agentId;

    const session = await ChatSession.findOne({ sessionId });
    if (!session || session.assignedAgent?.toString() !== currentAgentId) {
      socket.emit("error", { message: "Not authorized" });
      return;
    }

    // Check if target agent is online
    const targetSocket = agentConnections.get(targetAgentId);
    if (!targetSocket) {
      socket.emit("error", { message: "Target agent is offline" });
      return;
    }

    // Update session
    session.assignedAgent = targetAgentId;
    // You'd update agentInfo from the target agent's data
    await session.save();

    // Update local tracking
    const currentSessions = agentSessions.get(currentAgentId);
    if (currentSessions) currentSessions.delete(sessionId);

    const targetSessions = agentSessions.get(targetAgentId) || new Set();
    targetSessions.add(sessionId);
    agentSessions.set(targetAgentId, targetSessions);

    // Leave/join rooms
    socket.leave(`session:${sessionId}`);
    targetSocket.join(`session:${sessionId}`);

    // Notify agents
    socket.emit("session:transferred", { sessionId, targetAgentId });
    targetSocket.emit("session:received", {
      sessionId,
      guestInfo: session.guestInfo,
    });

    // Notify user of agent change
    const userSocket = activeConnections.get(sessionId);
    if (userSocket) {
      userSocket.emit("agent:changed", session.agentInfo);
    }
  } catch (error) {
    console.error("Handle transfer session error:", error);
    socket.emit("error", { message: "Failed to transfer session" });
  }
}

// ============ UTILITY FUNCTIONS ============

function notifyAgentOfUserStatus(sessionId, status, namespace) {
  ChatSession.findOne({ sessionId })
    .then((session) => {
      if (session?.assignedAgent) {
        const agentSocket = agentConnections.get(
          session.assignedAgent.toString(),
        );
        if (agentSocket) {
          agentSocket.emit("user:status", { sessionId, status });
        }
      }
    })
    .catch(console.error);
}

function notifyUserOfAgentStatus(sessionId, agentInfo, namespace) {
  const userSocket = activeConnections.get(sessionId);
  if (userSocket) {
    if (agentInfo) {
      userSocket.emit("agent:connected", agentInfo);
    } else {
      userSocket.emit("agent:disconnected");
    }
  }
}

async function cleanupStaleConnections(namespace) {
  console.log("Running stale connection cleanup...");

  // Clean up expired sessions in database
  await ChatSession.cleanupExpiredSessions();

  // Remove stale connections from maps
  for (const [sessionId, socket] of activeConnections) {
    if (!socket.connected) {
      activeConnections.delete(sessionId);
    }
  }

  for (const [agentId, socket] of agentConnections) {
    if (!socket.connected) {
      agentConnections.delete(agentId);
      agentSessions.delete(agentId);
    }
  }
}

// Export for use in index.js
module.exports = {
  initializeChatSocket,
  activeConnections,
  agentConnections,
};
