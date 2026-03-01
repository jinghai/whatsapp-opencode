#!/bin/bash
set -e

# Default bump type
BUMP_TYPE=${1:-patch}

echo "🚀 Starting release process ($BUMP_TYPE)..."

# Ensure working directory is clean
if [[ -n $(git status -s) ]]; then
  echo "❌ Error: Working directory is not clean. Please commit or stash changes."
  exit 1
fi

# 1. Run tests
echo "🧪 Running tests..."
npm run test:coverage

# 2. Bump version
echo "📦 Bumping version..."
npm version $BUMP_TYPE --no-git-tag-version

# Get new version
VERSION=$(node -p "require('./package.json').version")
echo "New version: $VERSION"

# 3. Generate changelog (simple git log since last tag)
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
echo "📝 Generating release notes..."
echo "# Release v$VERSION" > RELEASE_NOTES.md
echo "" >> RELEASE_NOTES.md
if [ -z "$LAST_TAG" ]; then
  git log --pretty=format:"- %s (%h)" >> RELEASE_NOTES.md
else
  git log ${LAST_TAG}..HEAD --pretty=format:"- %s (%h)" >> RELEASE_NOTES.md
fi

# 4. Commit and Tag
echo "💾 Committing changes..."
git add package.json RELEASE_NOTES.md
git commit -m "chore(release): v$VERSION"
git tag -a "v$VERSION" -m "Release v$VERSION"

# 5. Push
echo "⬆️ Pushing to remote..."
git push origin main
git push origin "v$VERSION"

# 6. Publish to npm
echo "📢 Publishing to npm..."
npm publish

echo "✅ Release v$VERSION completed successfully!"
