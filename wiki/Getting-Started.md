# 🚀 Getting Started with BhoomiSetu

This guide walks you through setting up and running BhoomiSetu on your local development workstation or preparing it for production deployment.

---

## 📋 Prerequisites

Ensure the following runtimes and tools are installed on your system:

| Tool | Version Requirement | Description |
| :--- | :--- | :--- |
| **Node.js** | `>= 20.x` | JavaScript runtime for Vite & React frontend |
| **npm** or **pnpm** | `>= 9.x` | Package manager |
| **Python** | `>= 3.10` | FastAPI backend runtime |
| **Rust & Cargo** | `>= 1.77.x` | Rust toolchain for compiling Tauri v2 desktop bundles |

### Platform-Specific Dependencies for Tauri
- **macOS:** Xcode Command Line Tools (`xcode-select --install`)
- **Windows:** Microsoft C++ Build Tools & WebView2 Runtime
- **Linux (Ubuntu/Debian):**
  ```bash
  sudo apt-get update && sudo apt-get install -y \
    libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libxdo-dev \
    libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
  ```

---

## 📥 Cloning the Repository

```bash
git clone https://github.com/Praneelved/bhumi-setu.git
cd bhumi-setu
```

---

## 🐍 Backend Setup (FastAPI & Local SQLite)

The backend provides REST APIs for authentication, land parcel tracking, project approvals, and compensation calculations. It uses a self-contained local SQLite database by default (`bhoomisetu_local.db`).

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   Create or verify `.env` in `backend/`:
   ```ini
   DATABASE_URL=sqlite:///./bhoomisetu_local.db
   SECRET_KEY=bhoomi_setu_secret_key_development_only_2024
   VIASOCKET_WEBHOOK_URL=https://flow.viasocket.com/yourapikey
   OTP_EXPIRY_MINUTES=10
   PORT=8000
   ```

5. **Start the API Server:**
   ```bash
   python3 main.py
   # Or directly with uvicorn:
   uvicorn main:app --reload --port 8000
   ```
   API Documentation is available live at `http://localhost:8000/docs`.

---

## 💻 Frontend & Desktop App Setup (Tauri + React)

1. **Install root & frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Launch in Desktop Development Mode:**
   ```bash
   npm run tauri dev
   ```
   This will start Vite on port `5173` and launch the native desktop shell window.

3. **Or run Web Browser Preview only:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 🧪 Testing the Authentication & OTP Flow

1. With the backend running, attempt login via the **Government**, **Agency**, or **Landowner** portal.
2. In development mode, check the backend console logs. When an OTP is requested, the server outputs:
   ```
   [viaSocket OTP to praneelved17@gmail.com] Status 200 dispatched
   ```
3. Enter the received OTP in the UI modal to complete authentication.
