const AppError = require("../utils/AppError");
const phonePattern = /^\+?[1-9]\d{7,14}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const orderStatuses = ["pending", "confirmed", "completed", "cancelled"];
const callStatuses = ["incoming", "active", "completed", "failed", "cancelled"];
const text = (value) => typeof value === "string" && value.trim().length > 0;

function validateCustomer({ addressRequired = false } = {}) { return (req, res, next) => {
  const { name, phone, address, email } = req.body;
  if (!text(name) || !phonePattern.test(String(phone || ""))) return next(new AppError("A valid name and phone number are required", 400));
  if (addressRequired && !text(address)) return next(new AppError("Address is required", 400));
  if (address !== undefined && !text(address)) return next(new AppError("Address must be a non-empty string", 400));
  if (email !== undefined && email !== "" && (!text(email) || !emailPattern.test(email))) return next(new AppError("Email must be valid", 400));
  next();
}; }
function validatePhoneParam(req, res, next) { if (!phonePattern.test(String(req.params.phone || ""))) return next(new AppError("Phone number is invalid", 400)); next(); }
function validateOrder(req, res, next) {
  const { phone, items, amount, status } = req.body;
  if (phone !== undefined && !phonePattern.test(String(phone))) return next(new AppError("Phone number is invalid", 400));
  if (items !== undefined && (!text(items) || items.trim().length > 2000)) return next(new AppError("Items must be a non-empty string", 400));
  if (amount !== undefined && (!Number.isFinite(Number(amount)) || Number(amount) <= 0)) return next(new AppError("Amount must be a positive number", 400));
  if (status !== undefined && !orderStatuses.includes(status)) return next(new AppError("Invalid order status", 400));
  next();
}
function requireOrderFields(req, res, next) { validateOrder(req, res, (err) => { if (err) return next(err); if (!text(req.body.phone) || !text(req.body.items) || req.body.amount === undefined) return next(new AppError("Phone, items and amount are required", 400)); next(); }); }
function validateCall(req, res, next) { if (!phonePattern.test(String(req.body.phone || ""))) return next(new AppError("A valid phone number is required", 400)); if (req.body.callId !== undefined && !text(req.body.callId)) return next(new AppError("callId must be a non-empty string", 400)); next(); }
function validateObjectId(param) { return (req, res, next) => { if (!/^[a-f\d]{24}$/i.test(req.params[param] || "")) return next(new AppError(`Invalid ${param}`, 400)); next(); }; }
module.exports = { validateCustomer, validatePhoneParam, validateOrder, requireOrderFields, validateCall, validateObjectId, orderStatuses, callStatuses };
