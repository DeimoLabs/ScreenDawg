const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const yaml = require('js-yaml');

const app = express();
const PORT = process.env.PORT || 3000;

// Load config.yaml
const configPath = path.join(__dirname, 'config.yaml');
let config = {
  site_name: '🖼️🐶 ScreenDawg',
  max_file_size_mb: 5,
  allowed_extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  cookie_name: 'screenDawgImages',
  cookie_max_age_days: 0,
};

try {
  if (fs.existsSync(configPath)) {
    const loadedConfig = yaml.load(fs.readFileSync(configPath, 'utf8'));
    config = { ...config, ...loadedConfig };
  }
} catch (e) {
  console.error('Error loading config.yaml:', e);
}

// Middleware
app.use(bodyParser.json());

// Serve index.html dynamically with {{SITE_NAME}} replacement
app.get('/', (req, res) => {
  const htmlPath = path.join(__dirname, 'public', 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replaceAll('{{SITE_NAME}}', config.site_name);
  res.send(html);
});

// Serve static files (JS, CSS, images, etc.)
app.use(express.static('public'));

// Endpoint to expose config to frontend (only needed config parts)
app.get('/config', (req, res) => {
  res.json({
    cookie_name: config.cookie_name,
    cookie_max_age_days: config.cookie_max_age_days,
  });
});

// Ensure links.json exists
const linksPath = path.join(__dirname, 'links.json');
if (!fs.existsSync(linksPath)) {
  fs.writeFileSync(linksPath, '{}');
}

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const dir = path.join(__dirname, 'uploads', month);
    fs.mkdirSync(dir, { recursive: true });
    req.savedMonth = month;
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const randomName = Math.random().toString(36).substring(2, 9);
    const finalName = randomName + ext;
    req.savedFilename = finalName;
    cb(null, finalName);
  }
});

// Check extension is allowed by config
function isAllowedExtension(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  return config.allowed_extensions.includes(ext);
}

const upload = multer({
  storage,
  limits: { fileSize: config.max_file_size_mb * 1024 * 1024 }, // From config.yaml
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    if (!isAllowedExtension(file.originalname)) {
      return cb(new Error('File extension not allowed'));
    }
    cb(null, true);
  }
});

// Upload route
app.post('/upload', upload.single('image'), (req, res) => {
  const filename = req.savedFilename;
  const month = req.savedMonth;

  let links = {};
  if (fs.existsSync(linksPath)) {
    links = JSON.parse(fs.readFileSync(linksPath, 'utf8'));
  }

  links[filename] = month;
  fs.writeFileSync(linksPath, JSON.stringify(links, null, 2));

  res.json({ success: true, url: `/${filename}` });
});

// Delete image route
app.delete('/delete-image', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing image URL' });

  try {
    const parsed = new URL(url, `http://${req.headers.host}`);
    const filename = path.basename(parsed.pathname);

    if (!/^[a-zA-Z0-9]{7}\.(jpg|jpeg|png|gif|webp)$/.test(filename)) {
      return res.status(400).json({ error: 'Invalid filename format' });
    }

    const links = JSON.parse(fs.readFileSync(linksPath, 'utf8'));
    const month = links[filename];
    if (!month) return res.status(404).json({ error: 'Month not found for this image' });

    const filePath = path.join(__dirname, 'uploads', month, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

    fs.unlinkSync(filePath);
    delete links[filename];
    fs.writeFileSync(linksPath, JSON.stringify(links, null, 2));

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting image' });
  }
});

// Clean URL redirection (e.g. /abc1234.jpg)
app.get('/:shortname', (req, res, next) => {
  const shortname = req.params.shortname;
  if (!/^[a-zA-Z0-9]{7}\.(jpg|jpeg|png|gif|webp)$/.test(shortname)) return next();

  if (!fs.existsSync(linksPath)) return res.status(404).send("Not found");
  const links = JSON.parse(fs.readFileSync(linksPath, 'utf8'));

  const month = links[shortname];
  if (!month) return res.status(404).send("Image not found");

  const filePath = path.join(__dirname, 'uploads', month, shortname);
  if (!fs.existsSync(filePath)) return res.status(404).send("File not found");

  res.sendFile(path.resolve(filePath));
});

// Error handler for uploads
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: `File too large. Max size is ${config.max_file_size_mb}MB.` });
  }
  if (err.message === 'Only image files are allowed') {
    return res.status(415).json({ error: 'Only image uploads are allowed.' });
  }
  if (err.message === 'File extension not allowed') {
    return res.status(415).json({ error: 'File extension not allowed.' });
  }
  res.status(500).json({ error: 'Server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`ScreenDawg backend running on http://localhost:${PORT}`);
});
