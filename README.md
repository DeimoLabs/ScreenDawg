# 🐶 ScreenDawg

**Your dawg for screenshots and image uploads.**  
A simple, no-login, drag-and-drop image uploader with clean short links, built for speed and privacy.

---

## 🚀 Live Demo

Want to try it out? Upload, copy, and delete images instantly:

🔗 **[https://demo.screendawg.app](https://demo.screendawg.app)**

No login needed. Just drag, drop, and share.

---

## ✨ Features

⚡ Instant, Anonymous Uploads
Drag and drop or click to upload images with no login, no signup, and no hassle.

🍪 Cookie-Based User Tracking
Each user is assigned a unique, anonymous ID to privately track their uploads across sessions.

🔗 Clean Short URLs
Every image gets a root-level link like https://yourdomain.com/abc1234.jpg, hiding folder structure for privacy and simplicity.

🖼️ Auto Gallery View
Your uploads are displayed below the uploader — only files that still exist are shown.

📋 Copy & 🗑️ Delete Controls
Each image includes a copyable link and a delete button (secured with a token).

🌗 Light/Dark Mode Toggle
Easily switch between light and dark themes. Your preference is remembered.

📥 ShareX Integration
Upload screenshots directly via ShareX using a downloadable .sxcu config — with copy/delete support baked in.

🔐 Secure Deletion Tokens
Each image has a private delete URL. Only you (or ShareX) can delete the image — no login needed.

📊 Admin Dashboard
Admins can securely log in, view upload stats, change their password, and manage all uploads from a central panel.

🖼️ Paginated Upload Manager
Admins get a list-style gallery of all uploads (25 per page) with thumbnails, full URLs, view counters, and delete buttons.

💨 Image Compression (No Resizing)
Uploads are compressed automatically (JPEG, PNG, WebP) to save space and improve speed — without changing dimensions.

👀 View Tracking (External Hits Only)
Each image tracks how many times it’s been viewed — only from external visitors.

🐶 Custom 404 Meme Page
Missing image or bad URL? Users see a fun 404 image and their existing uploads — no dead ends.

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
