# Changelog

All notable changes to BhoomiSetu are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v1.1.1] — 2026-09-23

### Added
- **Offline Network Detection**: All three login portals now detect real-time internet connectivity using a custom `useNetworkStatus` React hook.
- **OfflineBanner Component**: A contextual red banner appears instantly when internet drops, explaining that OTP delivery requires an active connection. A green "restored" banner appears when connectivity returns.
- **Disabled OTP Submit on Offline**: The "Send OTP" / "Authenticate & Generate MFA Code" button turns grey and is disabled automatically when offline, with button text updated to "📵 No Internet — Cannot Send OTP".

### Fixed
- Verified viaSocket OTP delivery pipeline (`Status 200` confirmed for both Government and Personal login flows).

---

## [v1.1.0] — 2026-09-23

### Added
- **Tauri v2 Desktop App**: BhoomiSetu is now a native desktop application targeting Windows (`.exe`), macOS (`.dmg`), and Linux (`.AppImage`).
- **GitHub Actions CI/CD**: Automated cross-platform release pipeline via `.github/workflows/release.yml`. A new release is built and published automatically on every `v*` tag push.
- **Optimized Release Build**: Rust release profile configured with `lto=true`, `codegen-units=1`, `opt-level="s"`, `strip=true`, and `panic="abort"` for smallest possible binary size.
- **Local SQLite Database**: Backend now automatically falls back to a local SQLite database when PostgreSQL is unavailable, enabling full offline use.
- **Root `package.json`**: Added convenience scripts at the project root so `npm run tauri dev` and `npm run dev` work without changing directories.

### Changed
- `vite.config.ts`: Added `clearScreen: false`, `strictPort: true`, `host: true` for Tauri dev server compatibility.
- Bundle identifier set to `in.gov.bhoomisetu`.
- GitHub Actions workflow upgraded to **Node.js 24** (Node 20 deprecated on GitHub runners).
- Added `permissions: contents: write` to workflow to allow automated GitHub Release creation.

---

## [v1.0.0] — 2026-09-22

### Added
- Initial stable release of BhoomiSetu web application.
- **Multi-Portal Architecture**: Separate login portals for Government, Agency, and Landowner/Personal users.
- **3-Stage Sequential Verification Pipeline**: District → State → Central document verification chain.
- **GIS Parcel Explorer**: Interactive cadastral map with Leaflet, parcel overlays, owner info cards.
- **MFA / 2FA Authentication**: Email OTP via viaSocket webhook for Government and Agency logins.
- **viaSocket Notification Engine**: Automated document rejection/approval alerts to landowners and agencies.
- **Role-Based Dashboards**: Scoped views for Central Admin, State Officer, District Officer, CALA, Agency Admin, Project Manager, Field Officer, and Landowner.
- **Real-Time Socket.IO**: Live project updates via WebSocket connections.
- **JWT Session Management**: Secure token-based authentication with role claims.
- **FastAPI Backend**: Python 3.10+ backend with automatic SQLite fallback.

---

[v1.1.1]: https://github.com/Praneelved/bhumi-setu/compare/v1.1.0...v1.1.1
[v1.1.0]: https://github.com/Praneelved/bhumi-setu/compare/v1.0.0...v1.1.0
[v1.0.0]: https://github.com/Praneelved/bhumi-setu/releases/tag/v1.0.0
