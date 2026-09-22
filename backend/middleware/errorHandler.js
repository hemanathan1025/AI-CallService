const AppError = require("../utils/AppError");

function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

function errorHandler(error, req, res, next) { // eslint-disable-line no-unused-vars
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error";
  if (error.name === "ValidationError") { statusCode = 400; message = Object.values(error.errors).map((e) => e.message).join(", "); }
  if (error.name === "CastError") { statusCode = 400; message = `Invalid ${error.path}`; }
  if (error.code === 11000) { statusCode = 409; message = `${Object.keys(error.keyPattern || {})[0] || "Resource"} already exists`; }
  if (error.name === "JsonWebTokenError") { statusCode = 401; message = "Invalid authentication token"; }
  if (error.name === "TokenExpiredError") { statusCode = 401; message = "Authentication token has expired"; }
  if (statusCode >= 500 && process.env.NODE_ENV === "production") message = "Internal server error";
  if (statusCode >= 500) console.error(error);
  res.status(statusCode).json({ success: false, message });
}

module.exports = { notFound, errorHandler };
