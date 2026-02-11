const Gallery = require ("../models/GallerySchema.js");

//logic for uploading a job to gallery
 const beauticianUploadJob = async (req, res) => {
  try {
    const { beauticianId, imageUrl, description } = req.body;
    if (!beauticianId || !imageUrl || !description) {
      return res.status(404).json({ message: "fields are required" });
    }
    const newGalleryItem = await Gallery.create({
      beauticianId,
      imageUrl,
      description,
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


module.exports={getAllGalleryItems,beauticianUploadJob}
