# 🗺️ GIS Mapping System

The GIS subsystem provides spatial visualization and parcel-level analytics across project corridors.

---

## 🧭 Spatial Data Architecture

BhoomiSetu renders cadastral plot boundaries directly onto interactive map layers.

- **Coordinate System:** WGS 84 (`EPSG:4326`) with reprojection support for UTM zones.
- **Map Engine:** Leaflet with high-performance vector rendering.
- **Base Layers:** OpenStreetMap tiles, OpenTopoMap, and satellite imagery overlays.

---

## 🎨 Parcel Status Color Codes

| Color | Status | Definition |
| :--- | :--- | :--- |
| 🟢 **Green** | `Cleared / Disbursed` | Title verified, compensation disbursed, physical possession transferred. |
| 🟡 **Yellow** | `Survey / In Progress` | Joint measurement survey underway or valuation under review. |
| 🔴 **Red** | `Disputed / Objection` | Active legal stay, title dispute, or pending arbitration hearing. |
| 🔵 **Blue** | `Proposed / Section 3A` | Preliminary corridor alignment notification published. |

---

## 📊 Features & Analytics

1. **Interactive Parcel Cards:** Clicking on any cadastral polygon displays:
   - Survey / Khasra Number
   - Registered Landowner Name
   - Total Plot Area (Acres / Hectares / Gunthas)
   - Acquired Area vs. Remaining Holding
   - Base Circle Rate vs. Determined Market Rate
2. **Buffer Analysis:** Compute right-of-way safety buffers (e.g., 30m, 45m, 60m) along linear highway and rail assets.
3. **Offline Map Tile Caching:** Essential vector boundaries remain viewable even when disconnected from cloud tile servers.
