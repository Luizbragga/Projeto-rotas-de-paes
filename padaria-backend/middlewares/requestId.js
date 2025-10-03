// padaria-backend/middlewares/requestId.js
const { randomUUID } = require("crypto");

module.exports = function requestId() {
  return (req, res, next) => {
    const incoming = String(req.headers["x-request-id"] || "").trim();
    const id = incoming || randomUUID();

    // anexa no req e responde no header
    req.requestId = id;
    res.setHeader("x-request-id", id);

    next();
  };
};
