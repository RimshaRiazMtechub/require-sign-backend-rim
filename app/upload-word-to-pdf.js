const express = require('express');
const multer = require('multer');
const { convert } = require('docx-to-pdf');

const app = express();
const port = 3000;

const upload = multer({ dest: 'uploads/' });

app.post('/uploadData', upload.single('docxFile'), async (req, res) => {
  try {
    const { path } = req.file;
    const pdfPath = `${path}.pdf`;
    await convert(path, pdfPath);
    res.json({ url: `/download/${pdfPath}` });
  } catch (error) {
    console.error('Error converting file:', error);
    res.status(500).json({ error: 'Failed to convert file' });
  }
});

app.get('/download/:pdfFile', (req, res) => {
  const { pdfFile } = req.params;
  res.download(`uploads/${pdfFile}`);
});


