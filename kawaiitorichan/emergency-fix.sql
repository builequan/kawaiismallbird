-- EMERGENCY FIX: Ensure schema is compatible with Payload CMS
-- This runs early in startup to fix any schema issues

-- Drop problematic ENUMs and recreate as VARCHAR columns
DO $$
BEGIN
    -- Check if _status is ENUM and convert to VARCHAR if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'posts'
        AND column_name = '_status'
        AND data_type = 'USER-DEFINED'
    ) THEN
        -- Backup data
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS _status_backup VARCHAR;
        UPDATE posts SET _status_backup = _status::text WHERE _status_backup IS NULL;

        -- Drop the ENUM column
        ALTER TABLE posts DROP COLUMN IF EXISTS _status;

        -- Recreate as VARCHAR
        ALTER TABLE posts ADD COLUMN _status VARCHAR DEFAULT 'published' NOT NULL;
        UPDATE posts SET _status = COALESCE(_status_backup, 'published');
        ALTER TABLE posts DROP COLUMN IF EXISTS _status_backup;
    END IF;

    -- Do the same for language
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'posts'
        AND column_name = 'language'
        AND data_type = 'USER-DEFINED'
    ) THEN
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS language_backup VARCHAR;
        UPDATE posts SET language_backup = language::text WHERE language_backup IS NULL;
        ALTER TABLE posts DROP COLUMN IF EXISTS language;
        ALTER TABLE posts ADD COLUMN language VARCHAR DEFAULT 'ja' NOT NULL;
        UPDATE posts SET language = COALESCE(language_backup, 'ja');
        ALTER TABLE posts DROP COLUMN IF EXISTS language_backup;
    END IF;
END $$;

-- Ensure ALL columns exist with proper types
ALTER TABLE posts ADD COLUMN IF NOT EXISTS _status VARCHAR DEFAULT 'published' NOT NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS language VARCHAR DEFAULT 'ja' NOT NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS title VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS slug VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content JSONB;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS excerpt JSONB;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hero_image_id INTEGER;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hero_image_alt VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_title VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_image_id INTEGER;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_description VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_keywords VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_focus_keyphrase VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMP(3) WITH TIME ZONE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS slug_lock BOOLEAN DEFAULT true;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) WITH TIME ZONE DEFAULT now();
ALTER TABLE posts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP(3) WITH TIME ZONE DEFAULT now();

-- WordPress metadata columns (ALL as VARCHAR for maximum compatibility)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS wordpress_metadata_original_author VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS wordpress_metadata_original_date TIMESTAMP(3) WITH TIME ZONE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS wordpress_metadata_modified_date TIMESTAMP(3) WITH TIME ZONE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS wordpress_metadata_status VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS wordpress_metadata_enable_comments BOOLEAN DEFAULT true;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS wordpress_metadata_enable_toc BOOLEAN DEFAULT true;

-- Internal links metadata
ALTER TABLE posts ADD COLUMN IF NOT EXISTS internal_links_metadata_version VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS internal_links_metadata_last_processed TIMESTAMP(3) WITH TIME ZONE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS internal_links_metadata_content_hash VARCHAR;

-- Affiliate links metadata
ALTER TABLE posts ADD COLUMN IF NOT EXISTS affiliate_links_metadata_version VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS affiliate_links_metadata_last_processed TIMESTAMP(3) WITH TIME ZONE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS affiliate_links_metadata_content_hash VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS affiliate_links_metadata_exclude_from_affiliates BOOLEAN DEFAULT false;

-- Content DB metadata
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_db_meta_original_id VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_db_meta_website_id NUMERIC;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_db_meta_language VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_db_meta_imported_at TIMESTAMP(3) WITH TIME ZONE;

-- Create relationship tables if they don't exist
CREATE TABLE IF NOT EXISTS posts_internal_links_metadata_links_added (
    id SERIAL PRIMARY KEY,
    _order INTEGER NOT NULL DEFAULT 0,
    _parent_id INTEGER,
    target_slug VARCHAR,
    anchor_text TEXT,
    position INTEGER,
    created_at TIMESTAMP(3) WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP(3) WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts_affiliate_links_metadata_links_added (
    id SERIAL PRIMARY KEY,
    _order INTEGER NOT NULL DEFAULT 0,
    _parent_id INTEGER,
    product_id VARCHAR,
    product_name VARCHAR,
    anchor_text TEXT,
    position INTEGER,
    type VARCHAR,
    created_at TIMESTAMP(3) WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP(3) WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts_populated_authors (
    id SERIAL PRIMARY KEY,
    _order INTEGER NOT NULL DEFAULT 0,
    _parent_id INTEGER,
    name VARCHAR,
    created_at TIMESTAMP(3) WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP(3) WITH TIME ZONE DEFAULT now()
);

-- Fix posts_rels table
ALTER TABLE posts_rels ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;
ALTER TABLE posts_rels ADD COLUMN IF NOT EXISTS parent_id INTEGER;
ALTER TABLE posts_rels ADD COLUMN IF NOT EXISTS posts_id INTEGER;
ALTER TABLE posts_rels ADD COLUMN IF NOT EXISTS users_id INTEGER;

-- Fix media table
ALTER TABLE media ADD COLUMN IF NOT EXISTS prefix VARCHAR DEFAULT 'media';
ALTER TABLE media ADD COLUMN IF NOT EXISTS _key VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS focal_x NUMERIC;
ALTER TABLE media ADD COLUMN IF NOT EXISTS focal_y NUMERIC;
ALTER TABLE media ADD COLUMN IF NOT EXISTS thumbnail_u_r_l VARCHAR;

-- Create indexes
CREATE INDEX IF NOT EXISTS posts__status_idx ON posts (_status);
CREATE INDEX IF NOT EXISTS posts_language_idx ON posts (language);
CREATE INDEX IF NOT EXISTS idx_internal_links_parent ON posts_internal_links_metadata_links_added(_parent_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_parent ON posts_affiliate_links_metadata_links_added(_parent_id);
CREATE INDEX IF NOT EXISTS idx_populated_authors_parent ON posts_populated_authors(_parent_id);
CREATE INDEX IF NOT EXISTS posts_rels_parent_idx ON posts_rels(parent_id);
CREATE INDEX IF NOT EXISTS posts_rels_order_idx ON posts_rels("order");

-- Set default values for critical fields
UPDATE posts SET _status = 'published' WHERE _status IS NULL OR _status = '';
UPDATE posts SET language = 'ja' WHERE language IS NULL OR language = '';

-- Ensure payload_migrations exists
CREATE TABLE IF NOT EXISTS payload_migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR,
    batch NUMERIC,
    updated_at TIMESTAMP(3) WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP(3) WITH TIME ZONE DEFAULT now()
);

-- Add initial migration record if not exists
INSERT INTO payload_migrations (name, batch, created_at, updated_at)
SELECT '00-init-db', 1, now(), now()
WHERE NOT EXISTS (
    SELECT 1 FROM payload_migrations WHERE name = '00-init-db'
);