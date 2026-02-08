const Beautician = require ("../models/BeauticianSchema.js");


 const updateBeauticianProfile = async (req, res) => {
  console.log("updateBeauticianProfile API hit!");
  try {
       if (req.body.specialties && typeof req.body.specialties === 'string') {
    req.body.specialties = req.body.specialties.split(',').map(s => s.trim());
}
    const beautician = await Beautician.findOneAndUpdate(
      { user: req.userId },
      req.body,
      { new: true, runValidators:true
       }
       
    );
 
    if (!beautician) {
      console.log("error occur");

      return res.status(404).json({ message: "Beautician not found" });
    }
    res.status(200).json({ message: "Beautician Profile Update", beautician });
  } catch (error) {
    console.log("something went wrong", error);
    res.status(500).json({ message: "internal server error", error });
  }
};

 const addService = async (req, res) => {
  try {
    const beautician = await Beautician.findOne({ user: req.user.id });
    beautician.services.push(req.body.serviceId);
    await beautician.save();

    res.status(200).json({ message: "Service added successfully" });
  } catch (error) {
    console.log("something went wrong", error);
    res.status(500).json({ message: "internal error", error });
  }
};

 const getBeauticianProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const beautician = await Beautician.findOne({ user:userId}).populate(
      "user"
    );
    if(!beautician){
      return res.status(404).json({message:"Beautician not found" });
    }
    res
      .status(200)
      .json({ message: "Beautician Profile fetched successfully", beautician });
  } catch (error) {
    console.log("Error fetching beautician profile:", error);
    res.status(500).json({ message: "internal error issue", error:error.message });
  }
};
 const getBeauticians = async (req, res) => {
  try {
    const beauticians = await Beautician.find().populate("user","-password");
    res
      .status(200)
      .json({ message: "Beauticians fetched successfully", beauticians });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: `internal error issue :` + error.message });
  }
};

const deleteBeautician = async (req,res)=>{
  
  try{
    const {id}= req.params
    const specialist = await Beautician.findByIdAndDelete(id);
    if(!specialist){
      return res.status(404).json({message:"Beautician not found"})
    }
    res.status(200).json({message:'Beautician Deleted!'})
    
  }catch(error){
    console.log("An error occured while deleting:", error)
    res.status(500).json({message:"Internal Server error:", error})
  }
}
module.exports= {getBeauticianProfile,getBeauticians,updateBeauticianProfile,addService,deleteBeautician}
