const jwt = require("jsonwebtoken");

// Factory function to create role-based middleware
const accessRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized - No user found" });
      }

      const userRole = req.user.role?.toLowerCase();
      const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());

      if (!normalizedAllowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          message: `Access denied. Required role(s): ${allowedRoles.join(", ")}` 
        });
      }

      next();
    } catch (error) {
      console.log("Access role error:", error);
      res.status(500).json({ message: "Something went wrong", error: error.message });
    }
  };
};

// Pre-configured middleware for common use cases
const isAdmin = accessRole("admin");
const isClient = accessRole("client");
const isBeautician = accessRole("beautician");
const isAdminOrBeautician = accessRole("admin", "beautician");

module.exports = { accessRole, isAdmin, isClient, isBeautician, isAdminOrBeautician };