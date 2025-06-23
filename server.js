const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");
const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();

// Load config.yaml
const config = yaml.load(fs.readFileSync("config.yaml", "utf8"));
const PORT = process.env.PORT || config.site?.port || 3000;
const baseUrl = config.site?.url || `http://localhost:${PORT}`;
const maxSizeBytes = (config.max_upload_mb || 5) * 1024 * 1024;

// Load admin users or create default
const ADMIN_USERS_FILE = "./admin_users.json";
let adminUsers = {};

function loadAdminUsers(config) {
  if (fs.existsSync(ADMIN_USERS_FILE)) {
    adminUsers = JSON.parse(fs.readFileSync(ADMIN_USERS_FILE, "utf8"));
  } else {
    const defaultUser = config.admin_default_user || "admin";
    const defaultPass = config.admin_default_pass || "changeme";

    const hashed = bcrypt.hashSync(defaultPass, 10);
    adminUsers[defaultUser] = hashed;

    fs.writeFileSync(ADMIN_USERS_FILE, JSON.stringify(adminUsers, null, 2));
    console.log(`✅ Default admin created: ${defaultUser}`);
  }
}
loadAdminUsers(config);

// Ensure folders exist
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("views")) fs.mkdirSync("views");

// Middleware
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: config.session_secret,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // true only if using HTTPS
}));

// Database
const dbPath = "./db.json";
let userDB = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath, "utf8")) : {};
function saveDB() {
  fs.writeFileSync(dbPath, JSON.stringify(userDB, null, 2));
}

// Multer
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
const upload = multer({ storage, limits: { fileSize: maxSizeBytes } });

// Cookie-based user tracking
app.use((req, res, next) => {
  if (!req.cookies.user_id) {
    const id = uuidv4();
    res.cookie("user_id", id, { maxAge: 365 * 24 * 60 * 60 * 1000 });
    req.user_id = id;
  } else {
    req.user_id = req.cookies.user_id;
  }
  next();
});

// Homepage
app.get("/", (req, res) => {
  const userId = req.user_id;
  const uploads = (userDB[userId] || [])
    .filter(entry => fs.existsSync(entry.path))
    .sort((a, b) => b.timestamp - a.timestamp);

  res.render("index", {
    siteTitle: config.site.title,
    baseUrl,
    maxUploadMb: config.max_upload_mb,
    uploads
  });
});

// ShareX config download (.sxcu)
app.get("/sharex-config.sxcu", (req, res) => {
  const sxcu = {
    Name: config.site.title || "ScreenDawg",
    Version: "14.0.1",
    DestinationType: "ImageUploader, FileUploader",
    RequestMethod: "POST",
    RequestURL: `${baseUrl}/upload`,
    Body: "MultipartFormData",
    FileFormName: "file",
    URL: "{json:link}",
    DeletionURL: "{json:delete}"
  };
  res.setHeader("Content-Disposition", "attachment; filename=ShareXconfig.sxcu");
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(sxcu, null, 2));
});

// Upload handler
app.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  const userId = req.user_id;

  if (!file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  const deleteToken = Math.random().toString(36).substring(2, 9);
  if (!userDB[userId]) userDB[userId] = [];

  userDB[userId].push({
    filename: file.filename,
    original: file.originalname,
    path: file.path,
    timestamp: Date.now(),
    token: deleteToken
  });

  saveDB();

  const isApi = req.headers.accept?.includes("application/json") || req.get("User-Agent")?.includes("ShareX");

  if (isApi) {
    return res.json({
      link: `${baseUrl}/${file.filename}`,
      delete: `${baseUrl}/delete-api/${file.filename}?token=${deleteToken}`
    });
  } else {
    return res.redirect("/");
  }
});

// Manual delete
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

// ShareX delete API
app.delete("/delete-api/:filename", (req, res) => {
  const filename = req.params.filename;
  const token = req.query.token;
  const allUploads = Object.entries(userDB);

  for (const [userId, uploads] of allUploads) {
    const index = uploads.findIndex(entry => entry.filename === filename);
    if (index !== -1) {
      if (uploads[index].token !== token) {
        return res.status(403).json({ success: false, message: "Invalid token." });
      }

      const filePath = uploads[index].path;
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      uploads.splice(index, 1);
      saveDB();
      return res.status(200).json({ success: true, message: "File deleted." });
    }
  }

  res.status(404).json({ success: false, message: "File not found." });
});

app.get("/delete-api/:filename", (req, res) => {
  const filename = req.params.filename;
  const token = req.query.token;
  const allUploads = Object.entries(userDB);

  for (const [userId, uploads] of allUploads) {
    const index = uploads.findIndex(entry => entry.filename === filename);
    if (index !== -1) {
      if (uploads[index].token !== token) {
        return res.status(403).send(`<h2>❌ Invalid token. Deletion not allowed.</h2>`);
      }

      const filePath = uploads[index].path;
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      uploads.splice(index, 1);
      saveDB();
      return res.send(`<h2>✅ File ${filename} deleted successfully.</h2>`);
    }
  }

  res.status(404).send(`<h2>❌ File not found or already deleted.</h2>`);
});

// ADMIN ROUTES
app.get("/admin", (req, res) => {
  if (req.session && req.session.admin) {
    res.render("admin_dashboard", {
      siteTitle: config.site.title,
      adminUser: req.session.admin
    });
  } else {
    res.render("admin_login", { siteTitle: config.site.title });
  }
});

app.post("/admin/login", express.urlencoded({ extended: true }), (req, res) => {
  const { username, password } = req.body;
  const hash = adminUsers[username];
  if (hash && bcrypt.compareSync(password, hash)) {
    req.session.admin = username;
    res.redirect("/admin");
  } else {
    res.send("❌ Invalid credentials. <a href='/admin'>Try again</a>");
  }
});

app.get("/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin");
  });
});

// Short clean redirect
app.get("/:filename", (req, res) => {
  const filename = req.params.filename;
  const allUploads = Object.values(userDB).flat();
  const match = allUploads.find(entry => entry.filename === filename);

  if (match && fs.existsSync(match.path)) {
    return res.sendFile(path.resolve(match.path));
  }

  res.status(404).send("Image not found.");
});

// File too large handler
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    const msg = `File too large. Max allowed is ${config.max_upload_mb}MB.`;
    return res.status(413).json({ message: msg });
  }
  next(err);
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ ScreenDawg running at ${baseUrl}`);
});
