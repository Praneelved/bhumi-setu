# 🔧 Troubleshooting & FAQ

Solutions to common installation, startup, and runtime inquiries.

---

## 🍎 macOS: "bhoomisetu is damaged and can't be opened"

### Cause:
macOS Gatekeeper blocks unsigned open-source applications downloaded from the internet because an Apple Developer Developer ID certificate ($99/year) was not attached to the binary.

### Fix:
1. Drag `bhoomisetu.app` into `/Applications`.
2. Open your macOS Terminal and execute:
   ```bash
   sudo xattr -cr /Applications/bhoomisetu.app
   ```
3. Type your Mac administrator password when prompted.
4. Launch the application normally from Applications or Spotlight.

---

## 📶 "No Internet Connection — OTP cannot be sent"

### Cause:
The application includes proactive offline network detection. If your operating system is disconnected from Wi-Fi or Ethernet, all portals display a top banner:
> *"No Internet Connection — OTP cannot be sent while offline. Please connect to the internet to proceed."*

### Fix:
1. Reconnect your system to an active internet connection.
2. The warning banner will automatically disappear and re-enable the submit buttons.

---

## 🗄️ Backend SQLite Database Issues

### Reset Local Database:
If you need to reset the local database schema to a fresh initial state:
```bash
cd backend
rm -f bhoomisetu_local.db
python3 main.py
```
SQLAlchemy will automatically recreate all required tables upon application startup.
