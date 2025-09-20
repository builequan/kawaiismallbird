#!/bin/sh
# Quick fix for database issues in Dokploy

echo "🔧 Quick Database Fix Script"
echo "==========================="

# Parse DATABASE_URI
if [ -n "$DATABASE_URI" ]; then
  export PGUSER=$(echo $DATABASE_URI | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  export PGPASSWORD=$(echo $DATABASE_URI | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
  export PGHOST=$(echo $DATABASE_URI | sed -n 's/.*@\([^:]*\):.*/\1/p')
  export PGPORT=$(echo $DATABASE_URI | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  export PGDATABASE=$(echo $DATABASE_URI | sed -n 's/.*\/\([^?]*\).*/\1/p')

  echo "📊 Fixing users table..."
  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" <<EOF
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expiration TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS salt VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hash VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lock_until TIMESTAMP;

CREATE TABLE IF NOT EXISTS users_sessions (
    id SERIAL PRIMARY KEY,
    _parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    _order INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- Don't create admin user - let Payload show registration screen
EOF

  echo "📊 Fixing media URLs..."
  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" <<EOF
UPDATE media SET url = REPLACE(url, '/api/media/file/', '/media/') WHERE url LIKE '/api/media/file/%';
UPDATE media SET url = CONCAT('/media/', filename) WHERE url IS NULL OR url = '';
EOF

  echo "✅ Database fixes applied!"

  # Check results
  USER_COUNT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) FROM users" 2>/dev/null)
  echo "Users in database: $USER_COUNT"

else
  echo "❌ DATABASE_URI not set!"
  exit 1
fi