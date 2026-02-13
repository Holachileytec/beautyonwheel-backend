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

const PORT = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://beautyplug.com.ng", // ADD THIS
  "https://www.beautyplug.com.ng", // ADD THIS
  "http://beautyplug.com.ng",
];

// app.use(
//   cors({
//     origin: allowedOrigins,
//     credentials: true,
//   }),
// );

// Enable CORS for Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // Must include your production frontend
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize chat socket handler
const chatNamespace = initializeChatSocket(io);
console.log("Chat socket initialized on /chat namespace");

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
});

// Make io accessible in routes if needed
app.set("io", io);
app.set("chatNamespace", chatNamespace);

// Middleware - ORDER MATTERS!
// 1. Configure Helmet with Socket.IO-friendly settings
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [
          "'self'",
          "https://beautyplug.com.ng",
          "https://www.beautyonwheels.com.ng",
        ],
        connectSrc: [
          "'self'",
          "https://beautyplug.com.ng", // API calls
          "wss://beautyplug.com.ng", // WebSocket
        ],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
);



// 2. Configure CORS to match Socket.IO settings
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

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
