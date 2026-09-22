const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// ==========================================
// CORS
// ==========================================

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        !allowedOrigins.length ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(
        new Error("Origin not allowed by CORS")
      );
    },

    methods: ["GET", "POST", "PUT"],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// ==========================================
// BODY PARSER
// ==========================================

app.use(
  express.json({
    limit: "100kb",
  })
);

// ==========================================
// RATE LIMIT
// ==========================================

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(
      process.env.RATE_LIMIT_MAX || 200
    ),
    standardHeaders: "draft-8",
    legacyHeaders: false,
  })
);

// ==========================================
// ROUTES
// ==========================================

// Customer routes
const customerRoutes = require("./routes/customerRoutes");

app.use(
  "/api/customers",
  customerRoutes
);

// Authentication routes
app.use(
  "/api/auth",
  require("./routes/authRoutes")
);

// Order routes
const orderRoutes = require("./routes/orderRoutes");

app.use(
  "/api/orders",
  orderRoutes
);

// Call routes
const callRoutes = require("./routes/callRoutes");

app.use(
  "/api/call",
  callRoutes
);

app.use(
  "/api/calls",
  callRoutes
);

// Conversation routes
app.use(
  "/api/conversations",
  require("./routes/conversationRoutes")
);

// ==========================================
// ROOT API
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AI Call Assistant Backend is running",
  });
});

// ==========================================
// DEBUG CUSTOMERS
// ==========================================

app.get(
  "/api/debug/customers",
  async (req, res) => {
    try {
      // Get all collections
      const collections =
        await mongoose.connection.db
          .listCollections()
          .toArray();

      const collectionNames =
        collections.map(
          (collection) => collection.name
        );

      // Read customers directly from MongoDB
      const customers =
        await mongoose.connection.db
          .collection("customers")
          .find({})
          .toArray();

      res.json({
        success: true,

        database:
          mongoose.connection.name,

        collection:
          "customers",

        collections:
          collectionNames,

        customerCount:
          customers.length,

        customers:
          customers,
      });

    } catch (error) {
      console.error(
        "Debug customers error:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// MONGODB
// ==========================================

const PORT =
  process.env.PORT || 5000;

async function connectToMongoDB() {

  if (!process.env.MONGO_URI) {
    throw new Error(
      "MONGO_URI is missing in backend/.env"
    );
  }

  try {

    await mongoose.connect(
      process.env.MONGO_URI,
      {
        dbName: process.env.MONGO_DB_NAME || undefined,
        serverSelectionTimeoutMS: 10000,
      }
    );

    console.log(
      "MongoDB connected successfully"
    );

    console.log(
      "MongoDB database:",
      mongoose.connection.name
    );

    // Show MongoDB collections
    const collections =
      await mongoose.connection.db
        .listCollections()
        .toArray();

    console.log(
      "MongoDB collections:",
      collections.map(
        (collection) =>
          collection.name
      )
    );

  } catch (error) {

    throw new Error(
      `MongoDB connection failed: ${error.message}`
    );
  }
}

// ==========================================
// ERROR HANDLING
// ==========================================

const {
  notFound,
  errorHandler,
} = require(
  "./middleware/errorHandler"
);

app.use(notFound);

app.use(errorHandler);

// ==========================================
// START SERVER
// ==========================================

async function startServer() {

  try {

    // Production CORS check
    if (
      process.env.NODE_ENV ===
        "production" &&
      !allowedOrigins.length
    ) {

      throw new Error(
        "CORS_ORIGIN must be configured in production"
      );
    }

    // Connect MongoDB first
    await connectToMongoDB();

    // Start server only after MongoDB connects
    const server =
      app.listen(
        PORT,
        () => {

          console.log(
            `Server running on http://localhost:${PORT}`
          );

        }
      );

    // ========================================
    // GRACEFUL SHUTDOWN
    // ========================================

    const shutdown = () => {

      console.log(
        "Shutting down server..."
      );

      server.close(
        async () => {

          await mongoose.connection.close();

          console.log(
            "MongoDB connection closed"
          );

          process.exit(0);

        }
      );

    };

    process.once(
      "SIGTERM",
      shutdown
    );

    process.once(
      "SIGINT",
      shutdown
    );

  } catch (error) {

    console.error(
      error.message
    );

    process.exitCode = 1;
  }
}

// ==========================================
// START APPLICATION
// ==========================================

if (require.main === module) {

  startServer();

}

module.exports = app;
