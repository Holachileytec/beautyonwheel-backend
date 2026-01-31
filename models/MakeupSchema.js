const mongoose = require("mongoose")

const MakeupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    price: {
        type: Number,
        required: true
    }

}, {
    timestamps: true,
}
)

module.exports = mongoose.model("Makeup", MakeupSchema)