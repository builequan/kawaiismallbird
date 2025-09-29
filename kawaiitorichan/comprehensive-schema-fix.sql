-- Comprehensive schema fix for Payload CMS PostgreSQL deployment
-- This adds ALL missing columns and tables that Payload CMS queries

-- ============================================
-- PART 1: Add all missing columns to posts table
-- ============================================

-- WordPress metadata columns
ALTER TABLE posts ADD COLUMN IF NOT EXISTS wordpress_metadata_original_author VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS wordpress_metadata_original_date TIMESTAMP(3) WITH TIME ZONE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS wordpress_metadata_modified_date TIMESTAMP(3) WITH TIME ZONE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS wordpress_metadata_status VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS wordpress_metadata_enable_comments BOOLEAN DEFAULT true;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS wordpress_metadata_enable_toc BOOLEAN DEFAULT true;

-- Internal links metadata columns
ALTER TABLE posts ADD COLUMN IF NOT EXISTS internal_links_metadata_version VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS internal_links_metadata_last_processed TIMESTAMP(3) WITH TIME ZONE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS internal_links_metadata_content_hash VARCHAR;

-- Content DB metadata columns
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_db_meta_original_id VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_db_meta_website_id NUMERIC;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_db_meta_language VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_db_meta_imported_at TIMESTAMP(3) WITH TIME ZONE;

-- Affiliate links metadata columns
ALTER TABLE posts ADD COLUMN IF NOT EXISTS affiliate_links_metadata_version VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS affiliate_links_metadata_last_processed TIMESTAMP(3) WITH TIME ZONE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS affiliate_links_metadata_content_hash VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS affiliate_links_metadata_exclude_from_affiliates BOOLEAN DEFAULT false;

-- Other essential columns
ALTER TABLE posts ADD COLUMN IF NOT EXISTS excerpt JSONB;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hero_image_alt VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_keywords VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_focus_keyphrase VARCHAR;

-- ============================================
-- PART 2: Create missing relationship tables
-- ============================================

-- Internal links metadata links added table
CREATE TABLE IF NOT EXISTS posts_internal_links_metadata_links_added (
    id SERIAL PRIMARY KEY,
    _order INTEGER NOT NULL DEFAULT 0,
    _parent_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    target_slug VARCHAR,
    anchor_text TEXT,
    position INTEGER,
    created_at TIMESTAMP(3) WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP(3) WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_internal_links_parent ON posts_internal_links_metadata_links_added(_parent_id);
CREATE INDEX IF NOT EXISTS idx_internal_links_order ON posts_internal_links_metadata_links_added(_order);

-- Affiliate links metadata links added table
CREATE TABLE IF NOT EXISTS posts_affiliate_links_metadata_links_added (
    id SERIAL PRIMARY KEY,
    _order INTEGER NOT NULL DEFAULT 0,
    _parent_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    product_id VARCHAR,
    product_name VARCHAR,
    anchor_text TEXT,
    position INTEGER,
    type VARCHAR,
    created_at TIMESTAMP(3) WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP(3) WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_affiliate_links_parent ON posts_affiliate_links_metadata_links_added(_parent_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_order ON posts_affiliate_links_metadata_links_added(_order);

-- Populated authors table
CREATE TABLE IF NOT EXISTS posts_populated_authors (
    id SERIAL PRIMARY KEY,
    _order INTEGER NOT NULL DEFAULT 0,
    _parent_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    name VARCHAR,
    created_at TIMESTAMP(3) WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP(3) WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_populated_authors_parent ON posts_populated_authors(_parent_id);
CREATE INDEX IF NOT EXISTS idx_populated_authors_order ON posts_populated_authors(_order);

-- ============================================
-- PART 3: Fix posts_rels table columns
-- ============================================

-- Ensure posts_rels has all required columns
ALTER TABLE posts_rels ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;
ALTER TABLE posts_rels ADD COLUMN IF NOT EXISTS parent_id INTEGER;
ALTER TABLE posts_rels ADD COLUMN IF NOT EXISTS posts_id INTEGER;
ALTER TABLE posts_rels ADD COLUMN IF NOT EXISTS users_id INTEGER;

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_posts_rels_parent ON posts_rels(parent_id);
CREATE INDEX IF NOT EXISTS idx_posts_rels_order ON posts_rels("order");

-- ============================================
-- PART 4: Fix media table columns
-- ============================================

-- Add media table columns (common Payload CMS issue)
ALTER TABLE media ADD COLUMN IF NOT EXISTS prefix VARCHAR DEFAULT 'media';
ALTER TABLE media ADD COLUMN IF NOT EXISTS _key VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS focal_x NUMERIC;
ALTER TABLE media ADD COLUMN IF NOT EXISTS focal_y NUMERIC;
ALTER TABLE media ADD COLUMN IF NOT EXISTS thumbnail_u_r_l VARCHAR;

-- ============================================
-- PART 5: Ensure _status and language columns exist
-- ============================================

-- Add _status column (use VARCHAR for compatibility)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS _status VARCHAR DEFAULT 'published' NOT NULL;

-- Add constraint if not exists
DO $$ BEGIN
  ALTER TABLE posts ADD CONSTRAINT posts_status_check
    CHECK (_status IN ('draft', 'published'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add language column
ALTER TABLE posts ADD COLUMN IF NOT EXISTS language VARCHAR DEFAULT 'ja' NOT NULL;

-- Add constraint if not exists
DO $$ BEGIN
  ALTER TABLE posts ADD CONSTRAINT posts_language_check
    CHECK (language IN ('ja', 'en'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create indexes for _status and language
CREATE INDEX IF NOT EXISTS posts__status_idx ON posts (_status);
CREATE INDEX IF NOT EXISTS posts_language_idx ON posts (language);

-- ============================================
-- PART 6: Update existing data defaults
-- ============================================

-- Set default values for any NULL columns
UPDATE posts SET _status = 'published' WHERE _status IS NULL;
UPDATE posts SET language = 'ja' WHERE language IS NULL;
UPDATE posts SET wordpress_metadata_enable_comments = true WHERE wordpress_metadata_enable_comments IS NULL;
UPDATE posts SET wordpress_metadata_enable_toc = true WHERE wordpress_metadata_enable_toc IS NULL;
UPDATE posts SET affiliate_links_metadata_exclude_from_affiliates = false WHERE affiliate_links_metadata_exclude_from_affiliates IS NULL;

-- ============================================
-- PART 7: Verification
-- ============================================

-- This section just prints verification info
DO $$
DECLARE
    missing_cols TEXT;
BEGIN
    -- Check for any still missing columns in posts table
    SELECT string_agg(column_name, ', ')
    INTO missing_cols
    FROM (
        VALUES
            ('wordpress_metadata_original_author'),
            ('wordpress_metadata_status'),
            ('internal_links_metadata_version'),
            ('affiliate_links_metadata_version'),
            ('_status')
    ) AS required(column_name)
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'posts'
        AND column_name = required.column_name
    );

    IF missing_cols IS NOT NULL THEN
        RAISE NOTICE 'Warning: Still missing columns: %', missing_cols;
    ELSE
        RAISE NOTICE 'Success: All required columns exist!';
    END IF;
END $$;