const ServiceType = require("../models/ServiceTypesSchema.js")




// Adding new makeup type
const addServiceType = async (req, res) => {
    const { name, price,category } = req.body
    try {
        if (!name || !price || !category) {
            return res.status(400).json({ message: "All fields are required" })
        }
        const doesServiceExist = await ServiceType.findOne({ name })
        if (doesServiceExist) {
            return res.status(400).json({ message: "This service already exists" })
        }

        const createService = await ServiceType.create({
            name,
            price,
            category,
        })
        res.status(200).json({ message: "Service Created sucessfully", createService })
    } catch (err) {
        console.log("Error", err)
        res.status(500).json({ message: "An error occured", err })
    }
}


// Updating a makeup type

const updateServiceType = async (req, res) => {
    try {
        const update = await ServiceType.findByIdAndUpdate(
            req.params.id,
            { name: req.body.name, price: req.body.price, category:req.body.category },
            { new: true, runValidators: true }
        )
        if (!update) {

            console.log("Service cannot update cause its not found", update);
            return res.status(400).json({ message: `An Error Ocured ${update}` })

        }
        res.status(200).json({ message: " Service updated!", update })
    } catch (err) {
        console.log("An error occured while updating", err)
        res.status(500).json({ message: "An error occured", err })
    }
}



const deleteServiceType = async (req, res) => {
    try {
        const deleteM = await ServiceType.findByIdAndDelete(req.params.id)
        if (!deleteM) {
            return res.status(400).json({ message: " Service not found" })
        }
        res.status(200).json({ message: " Service deleted Sucessfully", deleteM })
    } catch (err) {
        res.status(500).json({ message: "An error occured while deleting:", err })
    }
}

const getAllServiceTypes = async (req, res) => {
    try {
        const allService = await ServiceType.find()
        res.status(200).json({ message: "All  Services:", allService })

    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "An error occured while getting all services", err })
    }
}


const getOneServiceType = async (req, res) => {
    try {
        const singleService = await ServiceType.findById(req.params.id)
        if (!singleService) {
            return res.status(400).json({ message: "Makeup service not found" })
        }
        res.status(200).json({ message: "Makeup service found", singleService })
    } catch (err) {
        console.log("Error message", err)
        res.status(500).json({ message: "An error occured while getting a single makeup service", err })
    }
}


module.exports = { addServiceType, updateServiceType, deleteServiceType, getAllServiceTypes, getOneServiceType }