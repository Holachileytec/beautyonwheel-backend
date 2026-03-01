const Booking = require("../models/BookingSchema.js");
const User = require("../models/UserSchema.js");
const Service = require("../models/ServiceSchema.js");

// creating booking Client and Admin can create a booking
const createBooking = async (req, res) => {
  try {
    let clientId;

    // Ensure req.user exists
    if (!req.user)
      return res.status(401).json({ message: "User not authenticated" });

    // Client role: get the ID from JWT
    if (req.user.role === "client") {
      clientId = req.user.id || req.user._id;
    }

    // Admin role: get the ID from req.userId
    // req.body.clientId may be missing or is fake ..better request from JWT
    else if (req.user.role === "admin") {
      clientId = req.userId;
    }

    // If still undefined, throw error
    if (!clientId) {
      console.log("Cliend Id is requreide",clientId)
      return res.status(400).json({ message: "Client ID is required" });
    }

    const { service, address, city, note, date, status, phone } = req.body;
    console.log("Debug CreateBooking:", { address, clientId, service });

    if (!address || !clientId || !service) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newBooking = await Booking.create({
      client: clientId,
      service,
      address,
      city, // Added city
      note,
      date,
      status: status || "pending",
    });
    console.log("New Booking Created:", newBooking);

    res
      .status(201)
      .json({ message: "Booking Successfully Created", booking: newBooking });
  } catch (error) {
    // This will now tell you EXACTLY what Mongoose didn't like
    console.log("Detailed Error:", error);
    return res
      .status(500)
      .json({ message: "Database Error", error: error.message });
  }
};
//get All the Booking - Admin,client,beautifician

const allBookings = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const role = req.user?.role;
    let bookings;
    switch (role) {
      case "admin":
        console.log("Admin role detected");
        bookings = await Booking.find()
          .populate("client", "name email")
          .populate("beautician", "name email")
          .populate("service", "name price duration");
        break;

      case "client":
        console.log("Client role detected");
        bookings = await Booking.find({ client: req.userId })
          .populate("beautician", "name email")
          .populate("service", "name price duration");
        break;

      case "beautician":
        console.log("Beautician role detected");
        bookings = await Booking.find({ beautician: req.userId })
          .populate("client", "name email")
          .populate("service", "name price duration");
        break;

      default:
        console.log("Invalid role detected");
        return res.status(403).json({ message: "Not authorized" });
    }
    return res
      .status(200)
      .json({ message: " booking fetched succcessfully", bookings });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "error in fetching bookings" });
  }
};

const getSingleBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate("beautician", "name phone")
      .populate("client", "name phone")
      .populate("service", "name price duration");
    if (!booking) {
      console.log("invalid user, create an account and book an appointment");

      return res.status(404).json({ message: "booking not found" });
    }

    return res
      .status(200)
      .json({ message: "User apppointment booked successfully", booking });
  } catch (error) {
    console.log("something went wrong", error);
    res.status(500).json({ message: "something went wrong", error });
  }
};

const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!booking) {
      return res.status(400).json({ message: "Booking not found" });
    }
    res.status(200).json({ message: "User Booking  Updated" });
  } catch (error) {
    console.log("Booking not update", error);
    res.status(500).json({ message: "booking not update", error });
  }
};

const deleteBooking = async (req, res) => {
  try {
    const deleted = await Booking.findByIdAndDelete(req.params.id);
    if (!deleted) {
      console.log("booking not found", deleted);
      return res.status(400).json({ message: "booking not deleted", deleted });
    }
    return res.status(200).json({ message: "Booking deleted" });
  } catch (error) {
    console.log("error deleting booking", error);
    res.status(500).json({ message: "internal server error", error });
  }
};
module.exports = {
  deleteBooking,
  updateBooking,
  createBooking,
  getSingleBooking,
  allBookings,
};
