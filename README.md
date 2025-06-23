# 🐶 ScreenDawg

**Your dawg for screenshots and image uploads.**  
A simple, no-login, drag-and-drop image uploader with clean short links, built for speed and privacy.

---

## 🚀 Live Demo

Want to try it out? Upload, copy, and delete images instantly:

🔗 **[https://demo.screendawg.app](https://demo.screendawg.app)**

No login needed. Just drag, drop, and share.

---

## ✨ Features (v0.2.1)

- **⚡ Instant uploads**  
  Drag & drop or click to upload — no accounts required.

- **🍪 Anonymous user tracking**  
  Users are tracked via a unique cookie-based ID. No logins, no emails, just simple usage.

- **📎 Clean short URLs**  
  Each image gets a root-level short URL like `https://yourdomain.com/abc1234.jpg`  
  (actual folder structure stays hidden).

- **🖼️ Auto gallery**  
  Shows uploaded images that still exist — nothing broken or stale.

- **📋 Copy & 🗑️ Delete controls**  
  Each image has a full URL text field, copy button, and a delete button.

- **🌗 Light/Dark theme toggle**  
  Toggle between dark and light UI modes. Theme preference is saved and restored on return visits.

- **📥 ShareX integration**  
  Upload directly from your desktop using ShareX and a .sxcu config. Includes copy + delete support.

- **🔐 Secure deletion links**  
  Each upload includes a unique, tokenized delete link — only you or ShareX can use it. No accidental or malicious deletes.

- **🧠 "How it works" info box**  
  A friendly guide is shown below the upload form so first-time users know what’s going on.

---

## 📦 Tech Stack

- **Node.js** with **Express**
- **EJS** templating for dynamic frontend
- **Multer** for file uploads
- **Cookie-parser** for anonymous tracking
- **config.yaml** for site-wide config
- **db.json** for lightweight upload tracking (per-user)

> Note: SQLite support and metadata logging coming in future versions.

---

## 📃 License

MIT — do whatever you want, but don’t blame the dawg 🐾
