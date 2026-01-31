const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");
const s3 = require("../config/spaces");

const bucket = process.env.DO_SPACES_BUCKET;

function safeFileName(name) {
  const ext = path.extname(name || "").toLowerCase();
  const base = path
    .basename(name || "file", ext)
    .replace(/[^a-z0-9-_]/gi, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
  return `${base}${ext}`;
}

const upload = multer({
  storage: multerS3({
    s3,
    bucket,
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const filename = `${Date.now()}-${safeFileName(file.originalname)}`;
      cb(null, `uploads/${filename}`);
    },
  }),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

module.exports = upload;
