const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum:['normal','vip','vvip']
    },
    price: {
      type: Number,
      rquired: true,
    }

  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Plan", planSchema);
