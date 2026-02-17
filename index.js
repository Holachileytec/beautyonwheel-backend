const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const UserRoutes = require("./routes/UserRoutes.js");
const dotenv = require("dotenv").config();
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

// Environment check

const isDevelopment = process.env.NODE_ENV === "development";

// Allowed origins for CORS
const allowedOrigins = isDevelopment
  ? [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000",
    ]
  : [
      "https://beautyonwheels.com.ng",
      "https://www.beautyonwheels.com.ng",
      "https://beautyplug.com.ng",
      "https://www.beautyplug.com.ng",
    ];

console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Current Origins:", allowedOrigins);

// Middleware - ORDER MATTERS!

// 1. Configure Helmet with environment-specific settings
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

// 2. CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`CORS Blocked: ${origin} is not in`, allowedOrigins);
        callback(null, false);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

//3. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Cookie parser
// app.use(cookieParser());

// Socket.IO setup with CORS
console.log("Current Origins:", allowedOrigins);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  allowEIO3: true,
});

// Initialize chat socket handler
const chatNamespace = initializeChatSocket(io);
console.log("Chat socket initialized on /chat namespace");

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
});

// Make io accessible in routes
app.set("io", io);
app.set("chatNamespace", chatNamespace);
// 3. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Cookie parser
app.use(cookieParser());

// All routes eg User,Booking,Payment,Services,Preference,Dashboard
app.use("/api/users", UserRoutes);
app.use("/api/clients", clientRoute);
app.use("/api/services", ServiceRoutes);
app.use("/api/beauticians", BeauticianRoutes);
app.use("/api/bookings", BookingRoutes);
app.use("/api/admins", AdminRoutes);
app.use("/api/payments", PaymentRoute);
app.use("/api/paystack", paystackRoute);
app.use("/api/gallery", GalleryRoute);
app.use("/api/subservices", ServiceTypesRoutes);
app.use("/api/plan", planRoute);
app.use("/api/chat", chatRoute);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    socketConnections: io.engine.clientsCount,
  });
});

// Error handling for CORS issues
app.use((err, req, res, next) => {
  if (err.message.includes("CORS policy")) {
    res.status(403).json({
      error: "CORS Error",
      message: err.message,
    });
  } else {
    next(err);
  }
});

// Use server.listen instead of app.listen for Socket.io support
server.listen(PORT, () => {
  console.log(`Server listening on Port: ${PORT}`);
  console.log(`Socket.io enabled with /chat namespace`);
  console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
});
