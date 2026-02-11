const Service = require ("../models/ServiceSchema.js");

// Create a new service ....Route.Post("/api/services"), 1. endpoint

const createService = async (req, res) => {
  try {
    const { name, description, price, image } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const checkService = await Service.findOne({ name }); 
    
    if (checkService) {
      return res.status(400).json({ message: "Service Already exists" });
    }

    const newService = await Service.create({
      name,
      description,
      price,
      image,
    });

    res.status(201).json({
      message: "Service created successfully",
      service: newService
    });
  } catch (error) {
    console.error("Service Creation Error:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

// getAllService  endpoint ... GET("./api/services/getAllService")

 const getAllServices = async (req, res) => {
  try {
    const services = await Service.find()         
    res.status(200).json(services);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// getSingleService  GET("/api/services/:id");

 const getSingleService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: `Service not found` });
    }
    res.status(200).json(service);
  } catch (error) {
    console.log(`something mssing ${error}`);
    return res.status(500).json({ message: error.message });
  }
};

//updateService PUT("/api/services/:id") only beautifician or Admin

 const updateService = async (req, res) => {
  try {
    const updateService = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updateService) {
      console.log(`Service not found ${updateService}`);
     return res.status(404).json({ message: "Service not found" });
    }
    return res
      .status(200)
      .json({ message: "Service Updated Successfully", updateService });
  } catch (error) {
    console.log(`Service update error: ${error}`);
    res.status(500).json({ message: error.message });
  }
};

// deleteService DELETE("/api/services/:id")

 const deleteService = async (req, res) => {
  try {
    const deleted = await Service.findByIdAndDelete(req.params.id);
    if (!deleted) {
    return  res.status(404).json({ message: "Service not found" });
    }
    return res.status(200).json({ message: `Service deleted Sucessfully` });
  } catch (error) {
    console.log(`Service delete error:`, error);
    res.status(500).json({ message: ` something went wrong ${error}` });
  }
};
 module.exports={
  createService,
  getAllServices,
  getSingleService,
  updateService,
  deleteService,
};
