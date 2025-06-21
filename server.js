const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const month = new Date().toISOString().slice(5, 7);
    const dir = path.join(__dirname, 'uploads', month);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

app.post('/upload', upload.single('image'), (req, res) => {
  const month = new Date().toISOString().slice(5, 7);
  const filename = req.file.filename;
  const url = `/uploads/${month}/${filename}`;
  res.json({ url });  
});

app.listen(PORT, () => {
  console.log(`ScreenDawg backend running on http://localhost:${PORT}`);
});
