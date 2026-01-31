const mongoose = require("mongoose") ;

const clientSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  favouriteService: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],
  theme: { type: String, enum: ["dark", "light"], default: "light" },
  //Client preference
  notification: { type: Boolean, default: true },
});
module.exports= mongoose.model("Client", clientSchema);
