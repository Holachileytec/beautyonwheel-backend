const Gallery = require("../models/GallerySchema.js");

//logic for uploading a job to gallery
const beauticianUploadJob = async (req, res) => {
  console.log(req.file);
  console.log("hitting", req.file);

  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image file." });
    }

    const newGalleryItem = await Gallery.create({
      beauticianId: req.body.beauticianId,
       imageUrl: `/uploads/admin/${req.file.filename}`,
      description: req.body.description,
    });

    res
      .status(201)
      .json({ message: " Job uploaded successfully", newGalleryItem });
  } catch (error) {
    console.log("something went wrong when uploading job", error);
    res.status(500).json({ message: "internal server error", error });
  }
};

const getAllGalleryItems = async (req, res) => {
  try {
    const galleryItems = await Gallery.find().sort({ createdAt: -1 });
    res.status(200).json(galleryItems);
  } catch (error) {
    console.log("something went wrong when fetching gallery items", error);
    res.status(500).json({ message: "internal server error", error });
  }
};

const deleteGalleryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Gallery.findByIdAndDelete(id);
    if(!deleted)return res.status(404).json({message:"item not"})
    res.status(200).json({ message: "Image Deleted Successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error of=ccured while deleting image", error });
  }
};
module.exports = { getAllGalleryItems, beauticianUploadJob, deleteGalleryItem };
