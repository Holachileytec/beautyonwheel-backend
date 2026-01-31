const mongoose = require("mongoose")

const ServiceTypesSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    price: {
        type: String,
        required: true
    },
    category:{
        type:String,
      
    }

}, {
    timestamps: true,
}
)

module.exports = mongoose.model("ServiceType", ServiceTypesSchema)