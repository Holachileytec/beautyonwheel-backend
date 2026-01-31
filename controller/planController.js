const Plan = require("../models/planSchema.js")
const mongoose = require("mongoose")


const createPlan = async (req, res) => {
    try {
        const { name, price } = req.body;
        if (!name || !price) {
            return res.status(400).json({ message: "All fields are required" })
        }
        const plan = await Plan.findOne({ name })
        if (plan) {
            return res.status(400).json({ message: "Plan already exists" })

        }

        const savedPlan = await Plan.create({
            name: name,
            price: price
        })
        res.status(200).json({ message: "Plan created successfully", success: true, savedPlan })
    } catch (error) {
        res.status(500).json({ message: `An error occured: ${error}` })
    }
}


const getAllPlans = async (req, res) => {
    try {
        const plans = await Plan.find()
        res.status(200).json({ message: "Plans collected successfully", plans })
    } catch (error) {
        res.status(500).json({ message: `Plans could not be collected successfully:${error}` })
    }
}



const updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid id format" })
        }
        const plan = await Plan.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        )
        if (!plan) {
            return res.status(404).json({ message: "Plan not found or does not exist" })

        }
        res.status(200).json({ message: 'Plan updated successfully', plan })


    } catch (error) {
        res.status(500).json({ message: `An error occured : ${error}` })
    }
}




const deletePlan= async (req,res)=>{
try{
    const {id}=req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(400).json({message:"Invalid id format"})
    }

    const deleted = await Plan.findByIdAndDelete(id)
    if (!deleted) {
            return res.status(404).json({ message: "Plan not found" });
        }
    res.status(200).json({message:"Plan deleted successfully"})
}catch(error){
    res.status(500).json({message:`An error occures :${error}`})
}
}

module.exports = { createPlan, getAllPlans, updatePlan,deletePlan }