# 🌾 BhoomiSetu (भूमि सेतु)
> **Transparent, Automated & Multi-Tiered Land Acquisition Management Platform**  
> *Developed for Smart India Hackathon (SIH)*

---

## 📌 Overview

**BhoomiSetu** is an end-to-end digital land acquisition and compensation management system designed to streamline legal workflows, ensure fair compensation calculation, map geospatial ownership, and accelerate project approvals through a 3-tier government verification process.

The platform eliminates procedural delays, transparency bottlenecks, and record tampering by bringing **Landowners**, **Acquiring Agencies**, and **Government Officials (District, State, Central)** onto a unified, real-time dashboard.

---

## ✨ Key Features

### 🏢 1. Multi-Portal & Role-Based Workflows
- **Landowner Portal**: Track compensation status, view parcel boundaries, upload land titles, and review verification stages.
- **Requiring Agency Portal**: Submit new land acquisition proposals, view project progress, and track approval pipelines.
- **Government Portal**: Specialized multi-tiered access for verification, approval, and fund disbursement:
  - 📍 **District Level** (District Collector / Land Acquisition Officer)
  - 🏛️ **State Level** (State Revenue Department)
  - 🇮🇳 **Central Level** (Ministry / NITI Aayog)

---

### 🗺️ 2. GIS Parcel Explorer & Geospatial Mapping
- Interactive Leaflet-powered cadastral map displaying acquired, pending, and cleared land parcels.
- Dynamic info cards showing:
  - Parcel ID & Survey Numbers
  - Owner details & land category (Agricultural, Commercial, Residential)
  - Acquisition status, total area, and valuation details.

---

### 🔍 3. 3-Stage Sequential Verification Pipeline
Land acquisition claims and compensation approvals strictly follow a **Sequential Chain of Custody**:
1. **District Verification**: Initial ground truth check, title deed verification, and local survey validation.
2. **State Verification**: State revenue clearance, legal compliance check, and budget allocation.
3. **Central Approval**: Final approval, central treasury release, and viaSocket rejection/notification triggering.

---

### 🔔 4. viaSocket Notification & Rejection System
- Real-time webhook integration triggering automated alerts to landowners and agencies upon document verification or rejection with specified reasons.

---

## 🔑 Demo Credentials (SIH Evaluation)

> 💡 *All password credentials for demo accounts are safely managed via backend seed configurations.*

### 🏛️ Government Verification Accounts
| Role | Portal / Level | Email / ID |
| :--- | :--- | :--- |
| **District Officer** | District Verification | `district_collector@bhoomisetu.gov.in` |
| **State Officer** | State Verification | `state_revenue@bhoomisetu.gov.in` |
| **Central Officer** | Central Approval | `central_niti@bhoomisetu.gov.in` |

### 👨‍🌾 Landowner Account
- **Access**: Personal / Landowner Login
- **ID / Email**: `landowner@bhoomisetu.in`

### 🏗️ Requiring Agency Account
- **Access**: Agency Login
- **ID / Email**: `agency@nhai.gov.in`

---

## 🛠️ Tech Stack & Architecture

### **Frontend**
- **Framework**: React 18 (TypeScript, Vite)
- **Styling**: Tailwind CSS, Modern Glassmorphism & UI Design System
- **Mapping**: Leaflet, React-Leaflet
- **Icons**: Lucide React

### **Backend**
- **Framework**: Python 3.10+ (FastAPI)
- **Database**: SQLite (SQLAlchemy ORM / Raw SQL Data Layer)
- **Validation**: Pydantic v2
- **Integrations**: viaSocket Webhooks

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js (v18+) & npm
- Python (v3.10+)

---

### 1️⃣ Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Start FastAPI dev server (runs on http://localhost:8000)
python main.py
```

---

### 2️⃣ Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite dev server (runs on http://localhost:5173)
npm run dev
```

---

## 📸 SIH Demonstration Flow for Judges

1. **Step 1: Role Selection & Login**
   - Navigate to `http://localhost:5173/` and select **Government Login**, **Landowner Portal**, or **Agency Portal**.
2. **Step 2: GIS Explorer Inspection**
   - Open GIS Explorer to view interactive land maps, parcel ownership overlays, and acquisition boundaries.
3. **Step 3: Document Verification Pipeline**
   - Log in as **District Officer** -> Review and Approve pending parcel documents.
   - Log in as **State Officer** -> Verify passed district documents.
   - Log in as **Central Officer** -> Final approval & disbursement release.
4. **Step 4: Compensation & Rejection Notification**
   - Experience real-time status updates and viaSocket automated notification flow upon rejection or approval.

---

## 📄 License
Developed for educational & hackathon demonstration purposes (Smart India Hackathon).
