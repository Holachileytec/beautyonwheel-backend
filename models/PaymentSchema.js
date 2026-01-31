const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plan",
  },

  paymentType: {
    type: String,
    enum: ["booking", "subscription"],
    required: true
  },
  reference: { type: String, unique: true },

  transactionId: {
    type: String,
    unique: true,
    default: () => `txn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ["paystack", "transfer", "wallet"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "successful"]
  },
  currency: {
    type: String,
    required: true
  },
});
const Payment = mongoose.model("Payment", paymentSchema);
module.exports =  Payment ;
