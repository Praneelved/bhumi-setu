# 🏗️ Architecture & Technology Stack

BhoomiSetu utilizes a hybrid cross-platform desktop architecture designed for resilience in low-connectivity or high-security governmental field environments.

---

## 📐 High-Level Architectural Diagram

```
+------------------------------------------------------------------------+
|                      BhoomiSetu Desktop Application                     |
|                                                                        |
|  +------------------------------------------------------------------+  |
|  |             Frontend Presentation Layer (React 18 + TS)           |  |
|  |  - Government Portal    - Agency Portal     - Landowner Portal   |  |
|  |  - GIS Cadastral Maps   - Offline Banner    - Compensation Calc  |  |
|  +------------------------------------------------------------------+  |
|                                 |                                      |
|                                 v (IPC / HTTP localhost)               |
|  +------------------------------------------------------------------+  |
|  |                 Tauri v2 Desktop Runtime (Rust)                  |  |
|  |  - Native Windowing     - File System IO    - System Tray        |  |
|  |  - Secure Storage       - OS Notifications  - Deep Links         |  |
|  +------------------------------------------------------------------+  |
+-----------------------------------|------------------------------------+
                                    |
                                    v REST API (HTTP 8000)
+------------------------------------------------------------------------+
|                     FastAPI Backend Services Engine                    |
|                                                                        |
|  +---------------------+  +--------------------+  +-----------------+  |
|  | Auth & OTP Dispatch |  | Land Parcel Engine |  | Workflow Engine |  |
|  +---------------------+  +--------------------+  +-----------------+  |
|             |                       |                      |           |
|             v                       v                      v           |
|  +------------------------------------------------------------------+  |
|  |            Local SQLite Engine / Cloud PostgreSQL               |  |
|  |       (Wal-mode journal, zero-latency local relational store)    |  |
|  +------------------------------------------------------------------+  |
+-----------------------------------|------------------------------------+
                                    | Webhook integration
                                    v
                  +-----------------------------------+
                  |      External OTP / viaSocket     |
                  +-----------------------------------+
```

---

## 🧰 Technology Stack Details

### 1. Frontend & Client Runtime
- **Tauri v2 (Rust Core):** Ultra-compact desktop framework using system webviews (WebKit on macOS/Linux, WebView2 on Windows) rather than bundled Chromium. Consumes ~30-50MB RAM vs 300MB+ for Electron.
- **React 18 + TypeScript:** Strongly typed modular component tree.
- **Vite:** Next-generation sub-second HMR dev server and production asset bundler.
- **Tailwind CSS:** Responsive, accessible governmental design system with tailored dark/light contrasts.
- **Lucide React:** Standardized icon set for consistent UI ergonomics.
- **Leaflet & React-Leaflet:** Fast, client-side vector GIS rendering for cadastral parcel boundaries without heavy proprietary map dependencies.

### 2. Backend & Data Management
- **FastAPI (Python 3.10+):** Asynchronous, high-throughput REST API with automated OpenAPI 3.0 documentation.
- **SQLite (Local Database):** Default local persistence layer (`bhoomisetu_local.db`) with Write-Ahead Logging (WAL) for offline-capable deployments.
- **SQLAlchemy (ORM):** Database-agnostic abstraction layer supporting seamless transition to enterprise PostgreSQL clusters for cloud synchronization.
- **Pydantic v2:** Rigorous payload validation and schema enforcement.

### 3. Security & Telemetry
- **MFA (Multi-Factor Authentication):** Time-sensitive one-time passwords for administrative sessions.
- **viaSocket Webhook Integration:** Delivery of notification and verification codes.
- **Offline Network Detection:** Reactive browser hooks listening to OS network interfaces to prevent network timeout failures when offline.
