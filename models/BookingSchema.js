const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
    },

    note: {
      type: String,
    },
    date: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "complete", "cancel"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);
const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
