const jwt = require ("jsonwebtoken");

 const accessRole = async (req, res, next) => {
  try {
    {
      // check for admin
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied, Admin only" });

        // check for client
      } else if (!req.user || req.user.role !== "client") {
        return res.status(403).json({ message: "Access denied, Client only" });

        // check for beautician
      } else if (!req.user || req.user.role !== "beautician") {
        return res
          .status(403)
          .json({ message: "Access denied, Beautician only" });
      }
      next();
    }
  } catch (error) {
    console.log("Access role error:", error);
    res.status(500).json({ message: "something went wrong", error });
  }
};

module.exports={accessRole}