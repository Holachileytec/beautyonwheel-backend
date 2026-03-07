const Gallery = require("../models/GallerySchema.js");

//logic for uploading a job to gallery
const beauticianUploadJob = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image file." });
    }
    const newGalleryItem = await Gallery.create({
      beauticianId,
      imageUrl: `/uploads/${req.file.filename}`,
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

module.exports = { getAllGalleryItems, beauticianUploadJob };
