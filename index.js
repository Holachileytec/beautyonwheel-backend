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

// Creating http server for Socket.io
const server = http.createServer(app);

// Initialize Socket.io with CORS configuration
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Initialize chat socket handler
const chatNamespace = initializeChatSocket(io);
console.log("Chat socket initialized on /chat namespace");

// Make io accessible in routes if needed
app.set("io", io);
app.set("chatNamespace", chatNamespace);

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.urlencoded({ extended: "true" }));

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

// Use server.listen instead of app.listen for Socket.io support
server.listen(PORT, () => {
  console.log(`Server listening on Port: ${PORT}`);
  console.log(`Socket.io enabled with /chat namespace`);
});
