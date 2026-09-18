const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Customer routes
const customerRoutes = require("./routes/customerRoutes");
app.use("/api/customers", customerRoutes);

// Order routes
const orderRoutes = require("./routes/orderRoutes");
app.use("/api/orders", orderRoutes);

// call router
const callRoutes = require("./routes/callRoutes");
app.use("/api/call", callRoutes);
app.use("/api/calls", callRoutes);

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

connectToMongoDB();
