const express = require("express");
const path = require("path");
const multer = require("multer");
const app = express();
function getExtension(mimetype) {
  const map = {
    "image/jpg": "jpg",
    "image/jpeg": "jpeg",
    "image/png": "png",
  };
  return map[mimetype.toLowerCase()] || "";
}
const multerMiddleWareStorage = multer.diskStorage({
  destination: (req, res, callBack) => {
    callBack(null, "uploads/");
  },
  filename: (req, file, callBack) => {
    // const originalname = file.originalname.replace(/\s/g, ''); // Remove spaces
    // const timestamp = Date.now();
    // const extension = path.extname(originalname);
    // callBack(null, `${path.basename(originalname, extension)}${timestamp}${extension}`);
    const originalname = file.originalname.replace(/\s/g, ""); // Remove spaces
    const timestamp = Date.now();
    console.log(file);
    const extension = getExtension(file.mimetype);
    const nameWithoutExtension = path.basename(
      originalname,
      path.extname(originalname)
    );
    console.log(`${nameWithoutExtension}${timestamp}.${extension}`);
    callBack(null, `${nameWithoutExtension}${timestamp}.${extension}`);
  },
});
const fileFilter = (req, file, callBack) => {
  const allowedFileTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
  ];
  if (allowedFileTypes.includes(file.mimetype)) {
    callBack(null, true);
  } else {
    callBack(null, false);
  }
};
const upload = multer({
  storage: multerMiddleWareStorage,
  limits: {
    fileSize: 1000000000, // 1000000000 Bytes = 1000 MB
  },
  fileFilter: fileFilter,
});

const UploadImage = app.post("/", upload.single("image"), async (req, res) => {
  try {
    const imageUpload = req.file.path;

    res.json({ path: imageUpload });
  } catch (error) {
    res.send(error);
  }
});
module.exports = UploadImage;
