# 📦 Deployment & Releases Guide

BhoomiSetu automated multi-platform desktop release pipeline compiles native binaries for macOS, Windows, and Linux via GitHub Actions.

---

## 🚀 Automated Release Workflow

Whenever a new version tag is pushed (e.g. `git tag -a v1.1.2 -m "..." && git push origin v1.1.2`), the `.github/workflows/release.yml` pipeline triggers:

1. **macOS Runner (`macos-latest`):**
   - Compiles universal or Apple Silicon ARM64 / Intel x86_64 binaries.
   - Packages `.dmg` installer and `.app` bundle.
2. **Windows Runner (`windows-latest`):**
   - Compiles Windows binaries via MSVC toolchain.
   - Bundles `.msi` and `.exe` NSIS installer.
3. **Linux Runner (`ubuntu-22.04`):**
   - Installs WebKitGTK and AppIndicator headers.
   - Packages standalone `.AppImage` and `.deb` distribution packages.
4. **Automated GitHub Release Creation:**
   - Bundles all assets and publishes directly to [GitHub Releases](https://github.com/Praneelved/bhumi-setu/releases).

---

## 🛠️ Local Production Compilation

To produce production bundles locally:

```bash
cd frontend
npm run tauri build
```

Compiled deliverables will be located in:
`frontend/src-tauri/target/release/bundle/`
- macOS: `dmg/bhoomisetu_*.dmg`
- Windows: `nsis/bhoomisetu_*_setup.exe`
- Linux: `appimage/bhoomisetu_*.AppImage`
