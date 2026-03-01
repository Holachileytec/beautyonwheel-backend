const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const UserRoutes = require("./routes/UserRoutes.js");
require("dotenv").config();
const connectDB = require("./config/db.js");
const ServiceRoutes = require("./routes/ServicesRoute.js");
const BookingRoutes = require("./routes/BookingRoute.js");
const AdminRoutes = require("./routes/AdminRoute.js");
const clientRoute = require("./routes/ClientRoutes.js");
const BeauticianRoutes = require("./routes/beauticianRoute.js");
const SubscriptionRoute = require("./routes/SubscriptionRoute.js");
const PaymentRoute = require("./routes/paystackRoute.js");
const paystackRoute = require("./routes/paystackRoute.js");
const GalleryRoute = require("./routes/GalleryRoute.js");
const ServiceTypesRoutes = require("./routes/ServiceTypesRoute.js");
const planRoute = require("./routes/planRoute.js");
const chatRoute = require("./routes/chatRoute.js");
const { initializeChatSocket } = require("./socket/chatSocketHandler.js");

connectDB();
console.log("DB_URI from env:", process.env.mongodb_url);

const PORT = process.env.PORT || 8000;
const app = express();
const server = http.createServer(app);

// ============================================
// ENVIRONMENT CHECK
// ============================================

// Don't rely solely on NODE_ENV to decide allowed origins.
// Always define both sets so a missing/wrong NODE_ENV never locks you out.
const isDevelopment = process.env.NODE_ENV !== "production";

console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("isDevelopment:", isDevelopment);

// ============================================.
// ALLOWED ORIGINS
// ============================================

//  Merge dev + prod origins so the list is never accidentally empty.
// In production, localhost entries are harmless (browser won't send them).
// In development, prod entries are also harmless.
const allowedOrigins = [
  // --- Development ---
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  // --- Production ---
  "https://beautyonwheels.com.ng",
  "https://www.beautyonwheels.com.ng",
  "https://beautyplug.com.ng",
  "https://www.beautyplug.com.ng",
];

console.log("Allowed Origins:", allowedOrigins);

// ============================================
// CORS OPTIONS OBJECT  (single source of truth)
// ============================================

const corsOptions = {
  origin: function (origin, callback) {
    // Allow server-to-server / curl / mobile requests (no origin header)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Reject with an Error object so Express CORS sends proper 403.
      // Using callback(null, false) causes a silent failure with no CORS headers,
      // which the browser reports as a network error rather than a CORS error.
      console.error(`❌ CORS Blocked: "${origin}" not in allowed list`);
      callback(new Error(`CORS policy: Origin "${origin}" is not allowed`));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 200, // Some browsers (IE11) choke on 204
};

// ============================================
// MIDDLEWARE  — ORDER MATTERS!
// ============================================

// 1. Helmet — environment-specific
if (!isDevelopment) {
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [
            "'self'",
            "https://beautyonwheels.com.ng",
            "https://www.beautyonwheels.com.ng",
          ],
          connectSrc: [
            "'self'",
            "https://beautyplug.com.ng",
            "wss://beautyplug.com.ng",
            "https://api.paystack.co",
          ],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }),
  );
} else {
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: false,
    }),
  );
}

// 2. CORS — must come BEFORE routes
app.use(cors(corsOptions));

//  Explicitly handle OPTIONS preflight for ALL routes.
// Without this, browsers never get a response to their preflight request
// and block the actual request before it's even sent.
app.options(/.*/, cors(corsOptions));

// 3. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Cookie parser
app.use(cookieParser());

// ============================================
// SOCKET.IO
// ============================================

const io = new Server(server, {
  cors: {
    // Use the same allowed origins & options for consistency
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
  allowEIO3: true, // Backwards-compatibility with Socket.IO v3 clients
});

// Initialize chat socket handler
const chatNamespace = initializeChatSocket(io);
console.log("✅ Chat socket initialized on /chat namespace");

// Default namespace connection handler
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("disconnect", (reason) => {
    console.log(`🔌 User disconnected (${socket.id}): ${reason}`);
  });
});

// Make io & chatNamespace accessible inside route handlers
app.set("io", io);
app.set("chatNamespace", chatNamespace);

// ============================================
// ROUTES
// ============================================

app.use("/api/users", UserRoutes);
app.use("/api/clients", clientRoute);
app.use("/api/services", ServiceRoutes);
app.use("/api/beauticians", BeauticianRoutes);
app.use("/api/bookings", BookingRoutes);
app.use("/api/admin", AdminRoutes);
app.use("/api/payments", PaymentRoute);
app.use("/api/paystack", paystackRoute);
// app.use("/webhooks/paystack", paystackRoutes);
app.use("/api/gallery", GalleryRoute);
app.use("/api/subservices", ServiceTypesRoutes);
app.use("/api/plan", planRoute);
app.use("/api/chat", chatRoute);

// ============================================
// HEALTH CHECK
// ============================================

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "unknown",
    socketConnections: io.engine.clientsCount,
  });
});

// CORS test endpoint (useful for debugging)
app.get("/api/cors-test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CORS is configured correctly",
    origin: req.headers.origin || "no origin",
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

// FIX #6: Proper 4-argument error middleware (Express requires all 4 params)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("🚨 Error:", err.message);

  if (err.message && err.message.includes("CORS policy")) {
    return res.status(403).json({
      error: "CORS Error",
      message: err.message,
      hint: "Your origin is not in the allowed list. Contact the API administrator.",
    });
  }

  res.status(500).json({
    error: "Internal Server Error",
    message: isDevelopment ? err.message : "Something went wrong",
  });
});

// ============================================
// START SERVER
// ============================================
server.listen(PORT, () => {
  console.log(`\n🚀 Server listening on Port: ${PORT}`);
  console.log(`📡 Socket.IO enabled with /chat namespace`);
  console.log(`🌐 Allowed origins:\n   ${allowedOrigins.join("\n   ")}`);
  console.log(
    `🔧 Environment: ${process.env.NODE_ENV || "not set (defaulting to dev)"}\n`,
  );
});
