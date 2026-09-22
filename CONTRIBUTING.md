# Contributing to BhoomiSetu

Thank you for your interest in contributing! 🎉  
BhoomiSetu is an open platform to modernize land acquisition in India. All kinds of contributions are welcome — bug reports, feature requests, documentation improvements, and code.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branching Strategy](#branching-strategy)
- [Commit Message Convention](#commit-message-convention)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Reporting Bugs](#reporting-bugs)

---

## Code of Conduct

Please be respectful, inclusive, and constructive in all interactions. We follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

---

## Getting Started

1. **Fork** the repository.
2. **Clone** your fork:
   ```bash
   git clone https://github.com/<your-username>/bhumi-setu.git
   cd bhumi-setu
   ```
3. **Set up upstream**:
   ```bash
   git remote add upstream https://github.com/Praneelved/bhumi-setu.git
   ```
4. **Install dependencies** (see [README.md](README.md#-quickstart) for full setup).

---

## Development Workflow

```bash
# Sync with upstream before starting work
git fetch upstream
git rebase upstream/main

# Create a new feature branch
git checkout -b feat/your-feature-name

# Start the dev environment
# Terminal 1: Backend API
cd backend && source venv/bin/activate && uvicorn main:fastapi_app --reload --port 8000

# Terminal 2: Frontend or Desktop
cd frontend && npm run dev          # Browser
npm run tauri dev                   # Desktop app (from root)
```

---

## Branching Strategy

| Branch Pattern | Purpose |
|:---------------|:--------|
| `main` | Stable, production-ready code |
| `feat/<name>` | New features |
| `fix/<name>` | Bug fixes |
| `docs/<name>` | Documentation only changes |
| `refactor/<name>` | Code restructuring (no behaviour change) |
| `chore/<name>` | Tooling, CI, dependencies |

---

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(scope): short description

[optional body]
[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`

**Examples**:
```
feat(auth): add biometric login for landowner portal
fix(gis): parcel boundaries not rendering on Safari
docs(readme): update demo credentials table
chore(deps): upgrade Tauri to v2.11.6
```

---

## Pull Request Guidelines

- **One PR per feature/fix** — keep PRs focused and small.
- Add a **clear title** following the commit convention above.
- Fill in the PR description template (auto-generated).
- Ensure the **desktop app builds** locally (`npm run tauri build`).
- Do not commit `src-tauri/target/` or `frontend/dist/` — they are in `.gitignore`.

---

## Reporting Bugs

Please use the [GitHub Issue tracker](https://github.com/Praneelved/bhumi-setu/issues) and include:

- **OS & version** (Windows 11, macOS Sequoia, Ubuntu 22.04, etc.)
- **App version** (from the release tag)
- **Steps to reproduce**
- **Expected vs. actual behaviour**
- **Screenshots or logs** if available
