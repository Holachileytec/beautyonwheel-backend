/**
 * Role-based access control middleware
 * Use after auth middleware to restrict routes to specific roles
 */

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user exists (should be set by auth middleware)
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: "Access denied. Insufficient permissions.",
        requiredRole: allowedRoles,
        yourRole: req.user.role
      });
    }

    next();
  };
};

// Convenience middleware for common role checks
const isAdmin = requireRole("admin");
const isBeautician = requireRole("beautician");
const isClient = requireRole("client");
const isAdminOrBeautician = requireRole("admin", "beautician");

module.exports = {
  requireRole,
  isAdmin,
  isBeautician,
  isClient,
  isAdminOrBeautician
};
