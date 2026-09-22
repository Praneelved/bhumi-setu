#!/usr/bin/env bash
set -e

REPO_URL="https://github.com/Praneelved/bhumi-setu.wiki.git"
WIKI_DIR="wiki"
TEMP_DIR="/tmp/bhumi-setu-wiki-sync"

echo "=== Syncing BhoomiSetu Wiki ==="

if [ ! -d "$WIKI_DIR" ]; then
  echo "Error: Directory '$WIKI_DIR' not found."
  exit 1
fi

rm -rf "$TEMP_DIR"
echo "Cloning GitHub wiki repository..."

if git clone "$REPO_URL" "$TEMP_DIR" 2>/dev/null; then
  echo "Wiki repository cloned successfully."
  cp -r "$WIKI_DIR"/* "$TEMP_DIR"/
  cd "$TEMP_DIR"
  git add .
  if git status --porcelain | grep -q .; then
    git commit -m "docs(wiki): update wiki documentation"
    git push origin master
    echo "✅ Wiki synced and published successfully to GitHub!"
  else
    echo "Wiki is already up to date."
  fi
else
  echo "⚠️ The GitHub Wiki repository is not yet initialized on GitHub."
  echo "Please visit https://github.com/Praneelved/bhumi-setu/wiki and click 'Create the first page'."
  echo "Once created, re-run this script to automatically push all wiki pages."
fi
