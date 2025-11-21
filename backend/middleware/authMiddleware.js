const jwt = require("jsonwebtoken");

module.exports.verifyToken = function (req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ====================== ROLE CHECK ======================
module.exports.requireRole = function (role) {
  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ message: "Unauthenticated" });

    if (req.user.role !== role)
      return res.status(403).json({ message: "Access denied" });

    next();
  };
};

// Allow multiple roles
module.exports.allowRoles = function (roles = []) {
  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ message: "Unauthenticated" });

    if (!roles.includes(req.user.role))
      return res.status(403).json({ message: "Not allowed" });

    next();
  };
};
