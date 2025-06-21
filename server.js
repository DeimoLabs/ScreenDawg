const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(bodyParser.json());
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
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
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

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Max size is 5MB.' });
  }
  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong.' });
});

app.listen(PORT, () => {
  console.log(`ScreenDawg backend running on http://localhost:${PORT}`);
});


app.delete('/delete-image', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing image URL' });

  try {
    const parsed = new URL(url);
    const filePath = path.join(__dirname, parsed.pathname);
    if (!filePath.startsWith(path.join(__dirname, 'uploads'))) {
      return res.status(400).json({ error: 'Invalid image path' });
    }

    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error deleting file:', err);
        return res.status(404).json({ error: 'File not found or could not be deleted' });
      }
      res.json({ success: true });
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: 'Invalid URL' });
  }
});
