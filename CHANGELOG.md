# Changelog

All notable changes to BhoomiSetu are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v1.4.0] — 2026-09-23

### Added
- **New Project Proposal Module (Agency Login)**:
  - **Prominent "+ Submit New Project Proposal" Entry Button**: Added directly in the Agency Dashboard header and tab navigation.
  - **6-Step Professional Government Proposal Wizard (`NewProjectProposalWizard.tsx`)**:
    - **Step 1 – Project Information**: Auto-generated Proposal ID (`PRP-2026-00125`), Project Type (Highway, Airport, Metro, Railway, Industrial, etc.), Category, Priority, Duration, and Planned Start/Completion dates.
    - **Step 2 – Location & GIS Boundary**: State, District, Taluka, Village, and PIN code; interactive MapLibre GL GIS selection (Corridor, Polygon, Point) with auto-calculation of approximate project area (Acres/Ha), affected parcels count, and affected landowners.
    - **Step 3 – Project Details & Financials**: Large justification text areas (Objectives, Public Purpose, Urgency, Non-implementation consequences), multi-select expected benefits, and comprehensive cost breakdown (Land, Construction, Other, Total) with funding structure (Govt, Private, PPP).
    - **Step 4 – Land Requirement & Affected Parcels**: Breakdown of Government, Private, Forest, and Other land; real-time cadastral table populated from GIS database with Survey Numbers, Landowners, Villages, and Affected Area.
    - **Step 5 – Documents & Implementation Plan**: File upload system for DPR, Feasibility, SIA, Environmental clearances, and Site Layout maps with size validation; 6-phase milestone timeline (Planning, Land Identification, Acquisition, Approvals, Construction, Completion).
    - **Step 6 – Review, Agency Details, Declaration & Authorization**: Auto-populated authenticated agency profile (Agency Name, ID, Authorized Representative, Contact, Email, Address); mandatory statutory declaration checkbox; Authorized Representative digital confirmation; Save as Draft and Submit actions.
  - **My Project Proposals Tracking Registry**:
    - Interactive proposals registry in Agency Dashboard with lifecycle status badges (`Draft`, `Submitted – Pending Government Review`, `Under Government Review`, `Clarification Required`, `Approved`, `Rejected`).
    - Proposal Dossier Modal (`ProposalDetailModal.tsx`) with 6-stage lifecycle timeline.
    - **Two-Way Clarification Workflow**: Displays government clarification requests with officer remarks and actionable directives; provides an in-modal response and document resubmission interface.
- **Government Review Connection (`GovernmentDashboard.tsx` & `GovernmentProposalReviewModal.tsx`)**:
  - Dedicated "New Project Proposals" statutory review tab in the Government Dashboard with real-time pending badge.
  - Full-featured Government Review Modal allowing officers to inspect project charters, GIS corridors, cadastral parcels, and DPR documents.
  - **Clarification Request Action**: Officers can issue formal clarification notices specifying required actions and remarks.
  - **Statutory Approval & GIS Auto-Provisioning**: Approving a proposal generates a permanent Project ID and automatically provisions the project into both **Agency GIS** (`AGENCY_PROJECTS`) and **Government GIS** (`GOV_PROJECTS`), seamlessly connecting proposals to active acquisition monitoring.

---

## [v1.3.0] — 2026-09-23

### Added
- **Government GIS Monitoring Dashboard** (`/government/gis`): A dedicated, state/district-level GIS monitoring and decision-support command center for government officers and Competent Authorities (CALA).
  - **Executive 10-KPI Metric Strip**: Real-time aggregated statistics for Total Projects, Active, Completed, Delayed, Land Parcels, Affected Landowners, Land Required, Land Acquired, Compensation Pending, and Disputed Parcels.
  - **Interactive Cadastral GIS Map**: Vector street and high-resolution Esri satellite cartography with project corridor polygons and parcel-level cadastral boundaries with red encumbrance strokes for disputed land.
  - **Administrative Drill-Down**: Multi-tier administrative filtering from State → District → Taluka → Village → Project → Land Parcel → Landowner with auto-camera framing.
  - **Issues & Bottlenecks Registry**: Dedicated tracking tab for Documents Pending, Verification Pending, Compensation Pending, Collector Approval Pending, Disputed Land, and Delayed Acquisition with single-click flyTo.
  - **Priority Areas Requiring Attention**: Factual priority hotspots ranked by pending acreage, litigation injunctions, and delayed milestones.
  - **Multi-Project Comparison Tool**: Side-by-side benchmarking matrix for up to 4 infrastructure projects comparing required land, acquired land, pending claims, landowners, and court disputes.
  - **Statutory Dossier Audit Modal**: Comprehensive parcel-level statutory checklist, 7/12 extract verification, and RFCTLARR 2013 solatium calculator.
  - **Tri-Role GIS Routing**: Clean role-based dispatcher in `GISExplorer.tsx` providing distinct, dedicated GIS experiences for Landowners (`/gis`), Agencies (`/agency/gis`), and Government Officers (`/government/gis`).

---

## [v1.2.0] — 2026-09-23

### Added
- **Dedicated Agency GIS Map** (`/agency/gis`): Project-centric corridor explorer for agencies handling land acquisition projects.
  - Corridor boundary outlines with buffer zones for 6 national infrastructure projects.
  - Cadastral parcel polygons color-coded by acquisition status with centroid labels.
  - Landowner information sidebar and statutory holding dossier.
  - Project summary cards, multi-parameter search, and layer controls.

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
