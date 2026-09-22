const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const serializeUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role });
const createToken = (user) => {
  if (!process.env.JWT_SECRET) throw new AppError("JWT_SECRET is missing in the environment", 500);
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "8h" });
};
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "") || typeof password !== "string" || password.length < 8) throw new AppError("Name, valid email, and password of at least 8 characters are required", 400);
  if (role && !["user", "shop_owner"].includes(role)) throw new AppError("Only user or shop_owner role can be selected during registration", 403);
  if (await User.exists({ email: email.toLowerCase() })) throw new AppError("Email already registered", 409);
  const user = await User.create({ name, email, password, role: role || "shop_owner" });
  res.status(201).json({ success: true, message: "Registration successful", token: createToken(user), user: serializeUser(user) });
});
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError("Email and password are required", 400);
  const user = await User.findOne({ email: String(email).toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password))) throw new AppError("Invalid email or password", 401);
  res.json({ success: true, message: "Login successful", token: createToken(user), user: serializeUser(user) });
});
module.exports = { register, login };
