const jwt = require ("jsonwebtoken");

const auth = (req, res, next) => {
  const header = req.header("Authorization");
  console.log("AUTH HEADER:", header);

  if (!header) {
    return res.status(401).json({ message: " no token provided" });
  }
  const token = header.replace("Bearer", "").trim();
  console.log("extracted token:", token);
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.user=decoded;
    next();
  } catch (err) {
    console.log("error:", err);

    res.status(401).json({ message: "Invalid token", err });
  }
};
module.exports=auth;
