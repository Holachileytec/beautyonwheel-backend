const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
  
  },
  image: {
    type: String,
   
  }
});
const Service = mongoose.model("Service", serviceSchema);
module.exports = Service ;
