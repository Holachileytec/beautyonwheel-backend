const Client = require("../models/ClientSchema.js") ;

 const updateClientProfile = async (req, res) => {
  console.log("updateBeauticianProfile API hit!");
  try {
    const client = await Client.findOneAndUpdate(
      { user: req.userId },
      req.body,
      { new: true }
    );
    if (!client) {
      console.log("error occur");

      return res.status(404).json({ message: "Client not found" });
    }
    res.json({ message: "Client Profile Update", client });
  } catch (error) {
    console.log("something went wrong", error);
    res.status(500).json({ message: "internal server error", error });
  }
};

//  const addService = async (req, res) => {
//   try {
//     const beautician = await Beautician.findOne({ user: req.user.id });
//     beautician.services.push(req.body.serviceId);
//     await beautician.save();

//     res.status(200).json({ message: "Service added successfully" });
//   } catch (error) {
//     console.log("something went wrong", error);
//     res.status(500).json({ message: "internal error", error });
//   }
// };

 const getClientProfile = async (req, res) => {
  try {
    const client = await Client.findOne({ user: user.id }).populate("user");
    res
      .status(200)
      .json({ message: "Client Profile fetched successfully", client });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "internal error issue", error });
  }
};


module.exports= {getClientProfile,updateClientProfile}