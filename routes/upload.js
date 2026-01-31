const express = require("express");
const router = express.Router();
const upload = require("../Helper/uploadSpaces");

router.post("/upload-image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file" });
  }

  // Force CDN URL (recommended)
  const cdnUrl = req.file.location.replace(
    `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_ENDPOINT}`,
    process.env.DO_SPACES_CDN
  );

  return res.json({
    success: true,
    url: cdnUrl,
    key: req.file.key,
  });
});

module.exports = router;
