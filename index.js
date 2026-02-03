const express = require("express") ;
const cookieParser = require("cookie-parser") ;
const cors = require("cors") ;
const helmet = require("helmet") ;
const UserRoutes = require("./routes/UserRoutes.js") ;
const dotenv = require("dotenv").config() ;
const connectDB = require("./config/db.js") ;
const ServiceRoutes = require("./routes/ServicesRoute.js") ;
const BookingRoutes = require("./routes/BookingRoute.js") ;
const AdminRoutes = require("./routes/AdminRoute.js") ;
const clientRoute = require("./routes/ClientRoutes.js") ;
const BeauticianRoutes = require("./routes/beauticianRoute.js") ;
const SubscriptionRoute = require("./routes/SubscriptionRoute.js") ;
const PaymentRoute = require("./routes/paystackRoute.js") ;
const paystackRoute = require("./routes/paystackRoute.js") ;
const GalleryRoute = require("./routes/GalleryRoute.js") ;
const ServiceTypesRoutes =require("./routes/ServiceTypesRoute.js")
const planRoute=require("./routes/planRoute.js")

connectDB();
 
console.log("DB_URI from env:", process.env.mongodb_url)

const PORT = process.env.PORT ;
const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
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
app.use("/api/subservices",ServiceTypesRoutes)
app.use("/api/plan",planRoute)


app.listen(process.env.PORT, () => {
  console.log(`listening....proceed on Port: ${PORT}`);
});
