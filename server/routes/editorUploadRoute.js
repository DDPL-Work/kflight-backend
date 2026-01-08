const express = require("express");
const router = express.Router();
const cloudinary = require("../config/cloudinary"); // ✅ use your config
const upload = require("../middlewares/upload"); // ✅ use your multer setup

router.post("/upload-editor-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file uploaded" });
    }

    // Convert the in-memory buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString("base64");
const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "blogs/body", // 👈 save in this folder
      resource_type: "image",
    });

    return res.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("Editor image upload error:", error);
    res.status(500).json({
      success: false,
      message: "Image upload failed",
      error: error.message,
    });
  }
});

module.exports = router;