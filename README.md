Perfect 👍 here is your **clean, premium README** version —
✨ No GIF
✨ No images
✨ Clean badges
✨ Professional layout

You can copy-paste this directly.

---

# 🚀 LanCast

<p align="center">
  ⚡ Instant LAN File Sharing from your Terminal  
  <br/>
  <b>No setup. No cloud. No accounts.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/lancast?color=green" />
  <img src="https://img.shields.io/npm/dt/lancast?color=blue" />
  <img src="https://img.shields.io/npm/l/lancast" />
</p>

---

## ✨ What is LanCast?

**LanCast** is a LAN-based peer-to-peer file sharing tool that runs directly from your terminal.

It starts a local server and allows devices on the same network to discover each other and transfer files instantly.

🌐 Official Website:
👉 [https://lancast.zoherdev.xyz](https://lancast.zoherdev.xyz)

---

# ⚡ Installation

Install globally:

```bash
npm install -g lancast
```

---

# 🚀 Start LanCast

```bash
npx lancast start
```

or

```bash
lancast start
```

LanCast will automatically:

* Start server on port **3150**
* Detect your LAN IP
* Display access URLs
* Enable device discovery

Example output:

```
🌐 Local:   http://localhost:3150
📡 Network: http://192.168.1.25:3150
```

Open the network URL on any device connected to the same WiFi.

---

# 🧠 How It Works

```
Device A joins LAN
        ↓
Device B joins LAN
        ↓
LanCast shares connected devices
        ↓
Select device
        ↓
Peer connection established
        ↓
File transfers directly device → device
```

No cloud. No external storage.
Everything happens inside your local network.

---

# 🔥 Features

* ⚡ Instant device discovery
* 🔗 Direct peer-to-peer transfer
* 📁 Send large files
* 📡 Works on mobile & desktop
* 🚀 Zero configuration
* 🔐 Fully private (LAN only)

---

# 🏗 Tech Stack

* Node.js
* Express
* Socket.io
* WebRTC
* EJS

---

# 🛣 Roadmap

* [ ] Transfer progress indicator
* [ ] Drag & Drop support
* [ ] QR code quick connect
* [ ] PWA support
* [ ] Desktop version

---

# 👨‍💻 Author

Created by **Zoher Rangwala**

🌐 [https://zoherdev.xyz](https://zoherdev.xyz)
🌐 [https://lancast.zoherdev.xyz](https://lancast.zoherdev.xyz)
