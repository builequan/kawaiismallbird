#!/bin/sh
# Production initialization script for Dokploy deployment

echo "🦜 Initializing Kawaii Bird Production Environment..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
sleep 5

# Run database migrations and updates
echo "📊 Running database updates..."

# Update homepage
echo "🏠 Updating homepage..."
pnpm tsx scripts/update-homepage-bird.ts || echo "⚠️ Homepage update failed or already exists"

# Update about page
echo "📄 Updating about page..."
pnpm tsx scripts/update-about-bird.ts || echo "⚠️ About page update failed or already exists"

# Setup categories
echo "📂 Setting up bird categories..."
pnpm tsx scripts/setup-bird-categories.ts || echo "⚠️ Categories setup failed or already exists"

echo "✅ Production initialization complete!"
echo "🌐 Kawaii Bird is ready to serve!"