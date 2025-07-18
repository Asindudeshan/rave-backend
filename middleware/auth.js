const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

const requireEmployeeOrAdmin = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "employee") {
    return res
      .status(403)
      .json({ message: "Employee or Admin access required" });
  }
  next();
};

module.exports = { authenticateToken, requireAdmin, requireEmployeeOrAdmin };
