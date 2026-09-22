const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "").split(",").map((origin) => origin.trim()).filter(Boolean);
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin(origin, callback) { if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) return callback(null, true); return callback(new Error("Origin not allowed by CORS")); }, methods: ["GET", "POST", "PUT"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json({ limit: "100kb" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: Number(process.env.RATE_LIMIT_MAX || 200), standardHeaders: "draft-8", legacyHeaders: false }));

// Customer routes
const customerRoutes = require("./routes/customerRoutes");
app.use("/api/customers", customerRoutes);
app.use("/api/auth", require("./routes/authRoutes"));

// Order routes
const orderRoutes = require("./routes/orderRoutes");
app.use("/api/orders", orderRoutes);

// call router
const callRoutes = require("./routes/callRoutes");
app.use("/api/call", callRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/conversations", require("./routes/conversationRoutes"));

// Test API
app.get("/", (req, res) => {
  res.json({
    message: "AI Call Assistant Backend is running",
  });
});

const PORT = process.env.PORT || 5000;

async function connectToMongoDB() {
  if (!process.env.MONGO_URI) {
    console.error(
      "MongoDB connection failed: MONGO_URI is missing in backend/.env"
    );
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
  }
}

console.log("MONGO_URI exists:", !!process.env.MONGO_URI);

const { notFound, errorHandler } = require("./middleware/errorHandler");
app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

connectToMongoDB();
const shutdown = async () => { server.close(); await mongoose.connection.close(); process.exit(0); };
process.on("SIGTERM", shutdown); process.on("SIGINT", shutdown);

module.exports = app;
