const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");

// Load config
const config = yaml.load(fs.readFileSync("config.yaml", "utf8"));
const app = express();
const PORT = process.env.PORT || 3000;

// Create required folders
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("views")) fs.mkdirSync("views");

// Serve static files
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");

// JSON "database"
const dbPath = "./db.json";
let userDB = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath)) : {};
function saveDB() {
  fs.writeFileSync(dbPath, JSON.stringify(userDB, null, 2));
}

// Generate monthly upload folders and filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = `uploads/${new Date().toISOString().slice(0, 7)}`;
    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const random = Math.random().toString(36).substring(2, 9);
    cb(null, `${random}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: config.max_upload_mb * 1024 * 1024 }
});

// Assign or get user ID
app.use((req, res, next) => {
  if (!req.cookies.user_id) {
    const id = uuidv4();
    res.cookie("user_id", id, { maxAge: 31536000000 }); // 1 year
    req.user_id = id;
  } else {
    req.user_id = req.cookies.user_id;
  }
  next();
});

// Render homepage
app.get("/", (req, res) => {
  const userId = req.user_id;
  const uploads = (userDB[userId] || [])
    .filter(entry => fs.existsSync(entry.path))
    .sort((a, b) => b.timestamp - a.timestamp); // newest first

  res.render("index", {
    siteTitle: config.site_title,
    maxUploadMb: config.max_upload_mb,
    uploads
  });
});

// Handle uploads
app.post("/upload", upload.single("image"), (req, res) => {
  const file = req.file;
  const userId = req.user_id;

  if (!file) {
    return res.status(400).send("No file uploaded.");
  }

  if (!userDB[userId]) userDB[userId] = [];

  userDB[userId].push({
    filename: file.filename,
    original: file.originalname,
    path: file.path,
    timestamp: Date.now()
  });

  saveDB();
  res.redirect("/");
});

// Handle short URL redirect
app.get("/:filename", (req, res) => {
  const filename = req.params.filename;
  const allUploads = Object.values(userDB).flat();
  const match = allUploads.find(entry => entry.filename === filename);

  if (match && fs.existsSync(match.path)) {
    res.sendFile(path.resolve(match.path));
  } else {
    res.status(404).send("Image not found.");
  }
});

// Delete image route
app.post("/delete/:filename", (req, res) => {
  const filename = req.params.filename;
  const userId = req.user_id;

  if (!userDB[userId]) return res.redirect("/");

  const index = userDB[userId].findIndex(entry => entry.filename === filename);
  if (index !== -1) {
    const filePath = userDB[userId][index].path;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    userDB[userId].splice(index, 1);
    saveDB();
  }

  res.redirect("/");
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ ScreenDawg running on http://localhost:${PORT}`);
});
