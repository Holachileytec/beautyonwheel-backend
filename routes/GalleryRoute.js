const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware.js");

// Gallery routes
// Get all gallery items
router.get("/all-items", async (req, res) => {
  try {
    const Gallery = require("../models/GallerySchema.js");
    const galleryItems = await Gallery.find();
    res.status(200).json({ message: "Gallery items fetched successfully", galleryItems });
  } catch (error) {
    res.status(500).json({ message: "Error fetching gallery items", error: error.message });
  }
});

// Add gallery item (protected)
router.post("/add", auth, async (req, res) => {
  try {
    const Gallery = require("../models/GallerySchema.js");
    const { imageUrl, description, category } = req.body;
    const newItem = await Gallery.create({ imageUrl, description, category });
    res.status(201).json({ message: "Gallery item added successfully", newItem });
  } catch (error) {
    res.status(500).json({ message: "Error adding gallery item", error: error.message });
  }
});

// Delete gallery item (protected)
router.delete("/delete/:id", auth, async (req, res) => {
  try {
    const Gallery = require("../models/GallerySchema.js");
    const deleted = await Gallery.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Gallery item not found" });
    }
    res.status(200).json({ message: "Gallery item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting gallery item", error: error.message });
  }
});

module.exports = router;
