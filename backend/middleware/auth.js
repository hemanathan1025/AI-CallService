const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const requireAuth = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.startsWith("Bearer ") && req.headers.authorization.slice(7);
  if (!token) throw new AppError("Authentication token is required", 401);
  if (!process.env.JWT_SECRET) throw new AppError("Authentication is not configured", 500);
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(payload.id).select("-password");
  if (!user) throw new AppError("User no longer exists", 401);
  req.user = user;
  next();
});

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(new AppError("Authentication token is required", 401));
  if (!roles.includes(req.user.role)) return next(new AppError("You do not have permission for this action", 403));
  next();
};
module.exports = { requireAuth, requireRole };
