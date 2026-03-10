const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    const header = req.header("Authorization");
    console.log("AUTH HEADER:", header);

    // Check header exists and has correct format
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Safely extract token
    const token = header.slice(7).trim();
    console.log("Extracted token:", token);

    if (!token) {
      return res.status(401).json({ message: "Token is empty" });
    }

    // Verify JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not set in environment variables");
      return res.status(500).json({ message: "Server configuration error" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    // Normalize user ID across different payload shapes
    req.user = decoded;
    req.userId = decoded.id || decoded._id || decoded.userId;

    if (!req.userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    next();
  } catch (err) {
    console.error("Auth error:", err.name, err.message);

    // Return specific error messages based on error type
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (err.name === "NotBeforeError") {
      return res.status(401).json({ message: "Token not yet active" });
    }

    return res.status(401).json({ message: "Authentication failed" });
  }
};

module.exports = auth;
