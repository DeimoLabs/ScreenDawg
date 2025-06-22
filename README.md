# 🐶 ScreenDawg

**Your dawg for screenshots and image uploads.**  
A simple, no-login, drag-and-drop image uploader with clean short links, built for speed and privacy.

---

## 🚀 Live Demo

Want to try it out? Upload, copy, and delete images instantly:

🔗 **[https://demo.screendawg.app](https://demo.screendawg.app)**

No login needed. Just drag, drop, and share.

---

## ✨ Features (v0.1.0)

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

- **📅 Dynamic footer**  
  Automatically displays the site title and year, with GitHub project credits.

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

## 🛠️ Install & Run

```bash
git clone https://github.com/DeimoLabs/ScreenDawg.git
cd ScreenDawg
npm install
npm start
```

Then open [http://localhost:3000](http://localhost:3000)

---

## 🔧 Configuration

Update `config.yaml`:

```yaml
site_title: ScreenDawg
max_upload_mb: 5
```

Uploads are stored under `uploads/YYYY-MM`  
User upload data is tracked in `db.json`.

---

## 📈 Roadmap (v0.2+)

- [ ] Markdown/HTML embed code
- [ ] Upload progress bar
- [ ] Admin dashboard (file explorer, cleanups)
- [ ] Expiration + auto-deletion rules
- [ ] ShareX uploader config support
- [ ] Switch to SQLite with full metadata logging

---

## 📃 License

MIT — do whatever you want, but don’t blame the dawg 🐾

---

## 🔗 Powered by

**[ScreenDawg](https://github.com/DeimoLabs/ScreenDawg)**  
Maintained by [DeimoLabs](https://github.com/DeimoLabs)
