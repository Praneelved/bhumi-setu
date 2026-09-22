# 🏛️ BhoomiSetu — Official Project Wiki

Welcome to the **BhoomiSetu (भूमि सेतु)** documentation wiki. BhoomiSetu is a modern, enterprise-grade, offline-first National Land Acquisition and GIS Tracking System engineered for the **Smart India Hackathon (SIH 2024)**.

---

## 📚 Table of Contents

| Page | Description |
| :--- | :--- |
| [🚀 Getting Started](Getting-Started) | Prerequisites, local setup, backend initialization, and frontend desktop app execution. |
| [🏗️ Architecture & Tech Stack](Architecture-and-Tech-Stack) | Multi-tier architecture overview, Tauri v2 IPC bridge, FastAPI backend, and local database design. |
| [👥 User Portals Guide](User-Portals-Guide) | Comprehensive workflows for Government Officials, Acquisition Agencies, and Landowners. |
| [🗺️ GIS Mapping System](GIS-Mapping-System) | Cadastral parcel maps, Leaflet integration, survey numbers, geo-coordinates, and spatial status overlays. |
| [🔌 API Reference](API-Reference) | Endpoints for authentication, OTP verification, parcel queries, project approvals, and compensation tracking. |
| [📦 Deployment & Releases](Deployment-and-Releases) | Multi-OS cross-platform builds (macOS `.dmg`, Windows `.exe`, Linux `.AppImage`) via GitHub Actions. |
| [🔧 Troubleshooting & FAQ](Troubleshooting-and-FAQ) | Common issues, macOS Gatekeeper bypass, offline network detection, and database migrations. |

---

## 🌟 System Highlights

- **Multi-Role Portals:** Tailored interfaces and role-based access control (RBAC) for Government (District/State/Central), Executing Agencies (NHAI, Railways, Metro), and Landowners.
- **Cross-Platform Native Desktop Application:** Packaged using Tauri v2 and Rust for lightweight memory footprint (<50MB RAM) and high performance.
- **Offline-First Resilience:** Integrated SQLite local storage with real-time network detection. Safeguards authentication flows and caches land registry information locally.
- **2FA / MFA via OTP:** Real-time dual authentication dispatch via viaSocket webhook integration with automatic offline fallback warnings.
- **RFCTLARR Act Compliance:** Built in accordance with India's *Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013*.

---

## 🔗 Quick Links

- [GitHub Repository](https://github.com/Praneelved/bhumi-setu)
- [Latest Desktop Downloads](https://github.com/Praneelved/bhumi-setu/releases)
- [Issue Tracker & Bug Reports](https://github.com/Praneelved/bhumi-setu/issues)
- [Contributing Guidelines](https://github.com/Praneelved/bhumi-setu/blob/main/CONTRIBUTING.md)
