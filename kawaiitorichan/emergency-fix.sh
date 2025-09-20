#!/bin/sh
# Emergency fix for Dokploy - run this INSIDE the container

echo "🚨 EMERGENCY DATABASE FIX"
echo "========================"

# Check if psql is available
if ! command -v psql > /dev/null 2>&1; then
    echo "Installing postgresql-client..."
    apk add --no-cache postgresql-client
fi

# Fix all issues at once
psql $DATABASE_URI <<'SQLFIX'
-- Fix users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expiration TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS salt VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hash VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lock_until TIMESTAMP;

-- Create sessions table
CREATE TABLE IF NOT EXISTS users_sessions (
    id SERIAL PRIMARY KEY,
    _parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    _order INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- Fix media URLs
UPDATE media SET url = REPLACE(url, '/api/media/file/', '/media/') WHERE url LIKE '/api/media/file/%';
UPDATE media SET url = CONCAT('/media/', filename) WHERE url IS NULL OR url = '' OR url = '/media/';

-- Fix size URLs
UPDATE media SET sizes_thumbnail_url = REPLACE(sizes_thumbnail_url, '/api/media/file/', '/media/') WHERE sizes_thumbnail_url LIKE '/api/media/file/%';
UPDATE media SET sizes_small_url = REPLACE(sizes_small_url, '/api/media/file/', '/media/') WHERE sizes_small_url LIKE '/api/media/file/%';
UPDATE media SET sizes_medium_url = REPLACE(sizes_medium_url, '/api/media/file/', '/media/') WHERE sizes_medium_url LIKE '/api/media/file/%';
UPDATE media SET sizes_large_url = REPLACE(sizes_large_url, '/api/media/file/', '/media/') WHERE sizes_large_url LIKE '/api/media/file/%';

-- Create admin user (if not exists)
INSERT INTO users (email, name, created_at, updated_at)
SELECT 'admin@kawaii.com', 'Admin', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@kawaii.com');
SQLFIX

echo ""
echo "✅ Database fixed!"
echo ""
echo "📊 Checking results..."
psql $DATABASE_URI -c "SELECT COUNT(*) as users FROM users;"
psql $DATABASE_URI -c "SELECT COUNT(*) as posts FROM posts;"
psql $DATABASE_URI -c "SELECT COUNT(*) as media FROM media;"
echo ""
echo "🔑 Admin Access:"
echo "   Use 'Forgot Password' link to reset password for: admin@kawaii.com"
echo ""
echo "🎉 Done! Refresh your website now."