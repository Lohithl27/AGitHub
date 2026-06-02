#!/bin/bash
# ============================================================
# deploy_to_github.sh — Deploy git-robotics-academy to GitHub
# ============================================================
set -e

# Pass token via env var: GITHUB_TOKEN=<token> bash deploy_to_github.sh
TOKEN="${GITHUB_TOKEN:-}"
if [ -z "$TOKEN" ]; then
  read -rsp "GitHub Personal Access Token: " TOKEN
  echo ""
fi
REPO_NAME="AGitHub"
PROJECT_DIR="/home/rino/Documents/git-robotics-academy"

echo "🔍 Fetching your GitHub username..."
USERNAME=$(curl -s \
  -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user | python3 -c "import sys,json; print(json.load(sys.stdin)['login'])")

if [ -z "$USERNAME" ]; then
  echo "❌ Failed to fetch GitHub username. Check your token."
  exit 1
fi

echo "✅ Logged in as: $USERNAME"

# ── Create the GitHub repository ──────────────────────────────
echo ""
echo "📦 Creating GitHub repository '$REPO_NAME'..."
CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{
    \"name\": \"$REPO_NAME\",
    \"description\": \"Robotics Academy — interactive Git learning platform with Flask backend\",
    \"private\": false,
    \"auto_init\": false
  }")

HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -1)
BODY=$(echo "$CREATE_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "201" ]; then
  echo "✅ Repository created successfully!"
  REPO_URL="https://github.com/$USERNAME/$REPO_NAME"
  echo "   → $REPO_URL"
elif [ "$HTTP_CODE" = "422" ]; then
  echo "⚠️  Repository '$REPO_NAME' already exists — continuing with push..."
  REPO_URL="https://github.com/$USERNAME/$REPO_NAME"
else
  echo "❌ Failed to create repository (HTTP $HTTP_CODE)"
  echo "$BODY"
  exit 1
fi

# ── Initialize local git repo ─────────────────────────────────
echo ""
echo "🗂️  Initializing local git repository..."
cd "$PROJECT_DIR"

if [ ! -d ".git" ]; then
  git init
  echo "✅ Git initialized"
else
  echo "ℹ️  Git already initialized"
fi

# Configure git identity from GitHub token
GIT_EMAIL=$(curl -s \
  -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('email') or f\"{d['login']}@users.noreply.github.com\")")

git config user.name "$USERNAME"
git config user.email "$GIT_EMAIL"

# ── Stage all files ───────────────────────────────────────────
echo ""
echo "📁 Staging files..."
git add .
git status --short
echo "✅ Files staged"

# ── Commit ────────────────────────────────────────────────────
echo ""
echo "💾 Creating initial commit..."
git commit -m "🚀 Initial commit — Robotics Academy platform

- Flask backend with API endpoints
- Interactive Git learning frontend (HTML/CSS/JS)
- SQLite database for progress tracking
- Session management with Flask-Session"

echo "✅ Commit created"

# ── Set remote and push ───────────────────────────────────────
echo ""
echo "🔗 Setting up remote..."
REMOTE_URL="https://$USERNAME:$TOKEN@github.com/$USERNAME/$REPO_NAME.git"

if git remote | grep -q "^origin$"; then
  git remote set-url origin "$REMOTE_URL"
  echo "ℹ️  Updated existing remote 'origin'"
else
  git remote add origin "$REMOTE_URL"
  echo "✅ Remote 'origin' added"
fi

echo ""
echo "🚀 Pushing to GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "================================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "================================================"
echo "🌐 Repository URL : $REPO_URL"
echo "📂 Local path     : $PROJECT_DIR"
echo "🌿 Branch         : main"
echo "================================================"

# Clean up deploy script from the remote (optional)
echo ""
echo "💡 Tip: You can delete deploy_to_github.sh from the repo after deployment."
