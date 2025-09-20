-- Fix media table schema by adding missing columns
-- Run this in your database to fix the schema mismatch

-- Add missing columns to media table if they don't exist
ALTER TABLE media ADD COLUMN IF NOT EXISTS caption TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS alt TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS thumbnail_u_r_l VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS mime_type VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS filesize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS focal_x FLOAT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS focal_y FLOAT;

-- Add size variant columns
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_thumbnail_url VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_thumbnail_width INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_thumbnail_height INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_thumbnail_mime_type VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_thumbnail_filesize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_thumbnail_filename VARCHAR;

ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_square_url VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_square_width INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_square_height INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_square_mime_type VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_square_filesize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_square_filename VARCHAR;

ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_small_url VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_small_width INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_small_height INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_small_mime_type VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_small_filesize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_small_filename VARCHAR;

ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_medium_url VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_medium_width INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_medium_height INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_medium_mime_type VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_medium_filesize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_medium_filename VARCHAR;

ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_large_url VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_large_width INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_large_height INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_large_mime_type VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_large_filesize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_large_filename VARCHAR;

ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_xlarge_url VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_xlarge_width INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_xlarge_height INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_xlarge_mime_type VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_xlarge_filesize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_xlarge_filename VARCHAR;

ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_og_url VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_og_width INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_og_height INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_og_mime_type VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_og_filesize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_og_filename VARCHAR;

-- Verify the columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'media'
ORDER BY ordinal_position;