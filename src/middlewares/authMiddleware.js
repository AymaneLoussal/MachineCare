const jwt = require("jsonwebtoken");

const unauthorized = (res) => {
  return res.status(401).json({
    message: "Unauthorized",
  });
};

const authMiddleware = (req, res, next) => {
  const authorization = req.headers.authorization;
  const match = authorization && authorization.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    return unauthorized(res);
  }

  let decoded;
  try {
    decoded = jwt.verify(match[1], process.env.JWT_SECRET);
  } catch (error) {
    return unauthorized(res);
  }

  if (!decoded.id) {
    return unauthorized(res);
  }

  req.userId = decoded.id;
  return next();
};

module.exports = authMiddleware;
