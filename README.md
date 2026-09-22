<div align="center">

<img src="https://raw.githubusercontent.com/Praneelved/bhumi-setu/main/frontend/src-tauri/icons/icon.png" alt="BhoomiSetu Logo" width="120" />

# BhoomiSetu — भूमि सेतु

### National Land Acquisition Management System

*Transparent · Automated · Multi-Tiered · Offline-First*

[![Release](https://img.shields.io/github/v/release/Praneelved/bhumi-setu?style=flat-square&label=Latest%20Release&color=0a2540)](https://github.com/Praneelved/bhumi-setu/releases)
[![GitHub Actions](https://img.shields.io/github/actions/workflow/status/Praneelved/bhumi-setu/release.yml?style=flat-square&label=Desktop%20Build)](https://github.com/Praneelved/bhumi-setu/actions)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat-square&logo=tauri)](https://github.com/Praneelved/bhumi-setu/releases)
[![Made with Tauri](https://img.shields.io/badge/Made%20with-Tauri%20v2-24c8db?style=flat-square&logo=tauri)](https://tauri.app)
[![Wiki Documentation](https://img.shields.io/badge/Wiki-Documentation-blueviolet?style=flat-square&logo=gitbook)](wiki/Home.md)
[![Smart India Hackathon](https://img.shields.io/badge/Smart%20India%20Hackathon-2024-orange?style=flat-square)](https://www.sih.gov.in)

---

**[📥 Download Desktop App](#-desktop-downloads) · [🚀 Quickstart](#-quickstart) · [📖 Official Wiki](wiki/Home.md) · [🏗️ Architecture](#-architecture) · [🤝 Contributing](CONTRIBUTING.md)**

</div>

---

## 📌 What is BhoomiSetu?

**BhoomiSetu** (भूमि सेतु, meaning *"Land Bridge"*) is a production-ready, **offline-first desktop application** for managing the complete lifecycle of land acquisition under India's Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013 (RFCTLARR Act).

It eliminates paperwork delays, procedural bottlenecks, and record tampering by bringing **Landowners**, **Implementing Agencies (NHAI, Railways, etc.)**, and **Government Officials** (District, State, Central) onto a **unified, real-time dashboard** — accessible as a native desktop app on **Windows, macOS, and Linux**.

> 🏆 Developed for **Smart India Hackathon (SIH) 2024** — Problem Statement: *National Land Acquisition System*

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔐 Multi-Portal Authentication
- Three distinct secure login portals
- **MFA / 2FA** with Email OTP for all government & agency logins
- Offline awareness — disables OTP when no internet
- JWT-based session management

</td>
<td width="50%">

### 🗺️ GIS Parcel Explorer
- Interactive cadastral maps with Leaflet
- Live parcel overlays (acquired, pending, cleared)
- Survey number, owner details, area & valuation cards
- District-level spatial boundary rendering

</td>
</tr>
<tr>
<td>

### 🔍 3-Stage Verification Pipeline
Sequential chain-of-custody approval flow:
1. **District** → Ground truth & title deed check
2. **State** → Revenue clearance & legal compliance
3. **Central** → Final approval & treasury release

</td>
<td>

### 📊 Real-Time Dashboards
- Project KPIs (acquired hectares, at-risk count)
- Compensation tracking & disbursement status
- Statutory notifications & rejection alerts
- Role-scoped views per authority level

</td>
</tr>
<tr>
<td>

### 📡 viaSocket Notification Engine
- Real-time webhook-triggered email alerts
- Document rejection with granular reasons
- Automated landowner & agency notifications
- Central treasury disbursement alerts

</td>
<td>

### 🖥️ Native Desktop App (Tauri v2)
- Bundles to `.exe`, `.dmg`, `.AppImage`
- ~15MB install (vs 150MB Electron)
- Offline-first SQLite local database
- Built-in Rust-based backend shell

</td>
</tr>
</table>

---

## 📥 Desktop Downloads

Download the latest stable release for your operating system:

| Platform | Installer | Architecture |
|:---------|:----------|:-------------|
| 🍎 **macOS** | [`.dmg` Installer](https://github.com/Praneelved/bhumi-setu/releases/latest) | Apple Silicon + Intel |
| 🪟 **Windows** | [`.exe` / `.msi` Installer](https://github.com/Praneelved/bhumi-setu/releases/latest) | x64 |
| 🐧 **Linux** | [`.AppImage`](https://github.com/Praneelved/bhumi-setu/releases/latest) | x64 |

> ⚠️ **macOS Note:** If you see *"damaged and can't be opened"*, run this once in Terminal:
> ```bash
> sudo xattr -cr /Applications/bhoomisetu.app
> ```

---

## 🛠️ Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Desktop Shell** | [Tauri v2](https://tauri.app) (Rust) |
| **Frontend** | React 18 + TypeScript + Vite |
| **UI** | Vanilla CSS Design System + Lucide Icons |
| **Mapping** | MapLibre GL / Leaflet + React-Leaflet |
| **Backend API** | Python 3.10+ · FastAPI · Socket.IO |
| **Database** | SQLite (local, offline-first) + PostgreSQL (production) |
| **Auth** | JWT + Email OTP via [viaSocket](https://viasocket.com) |
| **CI/CD** | GitHub Actions (cross-platform Tauri builds) |

---

## 🏗️ Architecture

```
bhumi-setu/
├── frontend/               # React + Vite + TypeScript SPA
│   ├── src/
│   │   ├── pages/          # Login portals, dashboards, GIS explorer
│   │   ├── components/     # Reusable UI: OTPVerification, OfflineBanner, etc.
│   │   ├── services/       # API client (api.ts), Auth service (authService.ts)
│   │   └── hooks/          # useNetworkStatus, custom React hooks
│   └── src-tauri/          # Tauri v2 native app shell (Rust)
│       ├── Cargo.toml      # Rust deps + optimized release profile
│       └── tauri.conf.json # App bundle config (ID, window, permissions)
│
├── backend/                # FastAPI Python backend
│   ├── main.py             # App entry, all API routes
│   ├── db.py               # PostgreSQL + SQLite fallback DB layer
│   ├── sqlite_compat.py    # Offline-first local SQLite schema
│   ├── auth.py             # JWT, OTP, session management
│   ├── viasocket_service.py# Email notification webhook dispatcher
│   └── verification_service.py # 3-stage document verification engine
│
└── .github/
    └── workflows/
        └── release.yml     # GitHub Actions: build .exe/.dmg/.AppImage on tag push
```

---

## 🚀 Quickstart

### Prerequisites

- **Node.js** v20+ and **npm**
- **Python** 3.10+
- **Rust** (for Tauri desktop build only)

### 1️⃣ Backend

```bash
cd backend

# Create & activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the API server (auto-uses local SQLite if PostgreSQL unavailable)
uvicorn main:fastapi_app --reload --port 8000
```

### 2️⃣ Frontend (Browser)

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### 3️⃣ Desktop App (Tauri)

```bash
# From the project root:
npm run tauri dev       # Hot-reload desktop window

# Build native installers:
cd frontend
npm run tauri build     # Outputs to src-tauri/target/release/bundle/
```

---

## 🔑 Demo Credentials

> All accounts use password + Email OTP. For development, the OTP is logged to the backend terminal.

### 🏛️ Government Portal

| Role | Email | Password |
|:-----|:------|:---------|
| Central Admin | `central.admin@test.gov` | `Admin@123` |
| State Officer | `state.officer@test.gov` | `State@123` |
| District Officer | `district.officer@test.gov` | `District@123` |
| Acquisition Officer (CALA) | `revenue.cala.moradabad@nic.in` | `GovPortal@2026` |

### 🏗️ Agency Portal (NHAI)

| Role | Email | Password |
|:-----|:------|:---------|
| Agency Admin | `agency.admin@test.com` | `Agency@123` |
| Project Manager | `project.manager@test.com` | `Project@123` |
| Field Officer | `field.officer@test.com` | `Field@123` |

### 🧑‍🌾 Landowner Portal

| Mobile | Note |
|:-------|:-----|
| `9372161379` | OTP-only login, delivered to registered email |

---

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for the full version history.

**Latest: [v1.1.1](https://github.com/Praneelved/bhumi-setu/releases/tag/v1.1.1)** — Offline Network Detection & OTP Protection

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a PR.

```bash
# Fork → Clone → Branch → Commit → PR
git checkout -b feat/your-feature-name
```

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

Developed with ❤️ for **Smart India Hackathon 2024**.

---

<div align="center">

**[⬆ Back to top](#bhoomisetu--भूमि-सेतु)**

Made in India 🇮🇳

</div>
