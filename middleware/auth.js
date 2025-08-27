const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "mySecretKey");
    req.user = { ...decoded, _id: decoded.id };
    console.log("User authenticated:", req.user);
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};
