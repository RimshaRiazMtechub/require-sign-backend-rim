const express = require("express");
const path = require("path");
const multer = require("multer");

const { convert } = require("docx-to-pdf");
const app = express();

const multerMiddleWareStorage = multer.diskStorage({
  destination: (req, res, callBack) => {
    callBack(null, "uploads/");
  },
  filename: (req, file, callBack) => {
    callBack(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, callBack) => {
  const allowedFileTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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
    fileSize: 1000000000, // 1000 MB
  },
  fileFilter: fileFilter,
});

const UploadFile = app.post("/", upload.single("file"), async (req, res) => {
  try {
    let filePath;
    if (req.file.mimetype === "application/pdf") {
      filePath = req.file.path;
    } else if (
      req.file.mimetype === "application/msword" ||
      req.file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      //    Issue in Word to pdf
      const { path } = req.file;
      const pdfPath = `${path}.pdf`;
      await convert(path, pdfPath);
      console.log(filePath);
      filePath = pdfPath;
    }
    res.json({ path: filePath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = UploadFile;
