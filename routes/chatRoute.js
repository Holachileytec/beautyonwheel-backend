const express = require("express");
const router = express.Router();
const {
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
} = require("../controller/chatController.js");
const auth = require("../middleware/authMiddleware.js");

// ============ PUBLIC ENDPOINTS (for chat widget) ============
// These don't require authentication as guests can use the chat

// Create or get a chat session
router.post("/sessions", createSession);

// Get session by sessionId
router.get("/sessions/:sessionId", getSession);

// Get messages for a session
router.get("/sessions/:sessionId/messages", getSessionMessages);

// Save a message (called by socket handler or for persistence)
router.post("/sessions/:sessionId/messages", saveMessage);

// Request human agent (switches from AI to waiting queue)
router.post("/sessions/:sessionId/request-agent", requestHumanAgent);

// Close a session
router.post("/sessions/:sessionId/close", closeSession);

// ============ AGENT ENDPOINTS (require authentication) ============

// Get all sessions waiting for an agent
router.get("/queue", auth, getWaitingSessions);

// Get agent's currently active sessions
router.get("/agent/sessions", auth, getAgentSessions);

// Assign a session to the authenticated agent
router.post("/sessions/:sessionId/assign", auth, assignSessionToAgent);

// Transfer session to another agent
router.post("/sessions/:sessionId/transfer", auth, transferSession);

// ============ ADMIN ENDPOINTS (require authentication) ============

// Get chat statistics
router.get("/stats", auth, getChatStats);

// Manually trigger cleanup of expired sessions
router.post("/cleanup", auth, cleanupExpiredSessions);

module.exports = router;
