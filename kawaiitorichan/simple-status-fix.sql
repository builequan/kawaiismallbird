-- Simple fix for _status column using VARCHAR instead of ENUM
-- This is more compatible and less likely to fail

-- Add _status column as VARCHAR if it doesn't exist
ALTER TABLE posts ADD COLUMN IF NOT EXISTS _status VARCHAR DEFAULT 'published' NOT NULL;

-- Add language column as VARCHAR if it doesn't exist
ALTER TABLE posts ADD COLUMN IF NOT EXISTS language VARCHAR DEFAULT 'ja' NOT NULL;

-- Update any NULL values
UPDATE posts SET _status = 'published' WHERE _status IS NULL OR _status = '';
UPDATE posts SET language = 'ja' WHERE language IS NULL OR language = '';

-- Add constraints to validate values
DO $$ BEGIN
  ALTER TABLE posts ADD CONSTRAINT posts_status_check
    CHECK (_status IN ('draft', 'published'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE posts ADD CONSTRAINT posts_language_check
    CHECK (language IN ('ja', 'en'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS posts__status_idx ON posts (_status);
CREATE INDEX IF NOT EXISTS posts_language_idx ON posts (language);

-- Add other commonly missing columns
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hero_image_alt VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_keywords VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_focus_keyphrase VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS excerpt JSONB;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS internal_links_metadata_version VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS affiliate_links_metadata_version VARCHAR;