-- Fix users table and media issues

-- 1. Fix users table by adding missing columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expiration TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS salt VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hash VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lock_until TIMESTAMP;

-- 2. Create users_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS users_sessions (
    id SERIAL PRIMARY KEY,
    _parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    _order INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- 3. Add a default admin user if no users exist
INSERT INTO users (email, name, created_at, updated_at)
SELECT 'admin@example.com', 'Admin User', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com');

-- 4. Fix media URLs - update paths to use correct format
UPDATE media
SET url = REPLACE(url, '/api/media/file/', '/media/')
WHERE url LIKE '/api/media/file/%';

UPDATE media
SET url = CONCAT('/media/', filename)
WHERE url IS NULL OR url = '';

-- 5. Update all size variant URLs
UPDATE media SET sizes_thumbnail_url = REPLACE(sizes_thumbnail_url, '/api/media/file/', '/media/') WHERE sizes_thumbnail_url LIKE '/api/media/file/%';
UPDATE media SET sizes_square_url = REPLACE(sizes_square_url, '/api/media/file/', '/media/') WHERE sizes_square_url LIKE '/api/media/file/%';
UPDATE media SET sizes_small_url = REPLACE(sizes_small_url, '/api/media/file/', '/media/') WHERE sizes_small_url LIKE '/api/media/file/%';
UPDATE media SET sizes_medium_url = REPLACE(sizes_medium_url, '/api/media/file/', '/media/') WHERE sizes_medium_url LIKE '/api/media/file/%';
UPDATE media SET sizes_large_url = REPLACE(sizes_large_url, '/api/media/file/', '/media/') WHERE sizes_large_url LIKE '/api/media/file/%';
UPDATE media SET sizes_xlarge_url = REPLACE(sizes_xlarge_url, '/api/media/file/', '/media/') WHERE sizes_xlarge_url LIKE '/api/media/file/%';
UPDATE media SET sizes_og_url = REPLACE(sizes_og_url, '/api/media/file/', '/media/') WHERE sizes_og_url LIKE '/api/media/file/%';

-- 6. Verify the fixes
SELECT 'Users table columns:' as info;
SELECT column_name FROM information_schema.columns WHERE table_name = 'users';

SELECT 'Sample media URLs:' as info;
SELECT id, filename, url FROM media LIMIT 5;