-- Add Comments collection schema
-- This file adds all necessary tables and columns for the Comments feature

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    author_name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    approved BOOLEAN DEFAULT false NOT NULL,
    ip_address VARCHAR,
    updated_at TIMESTAMP(3) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP(3) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for comments
CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments (post_id);
CREATE INDEX IF NOT EXISTS comments_approved_idx ON comments (approved);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON comments (created_at DESC);

-- Add comments_id column to payload_locked_documents_rels if it doesn't exist
-- Note: We add the column without foreign key first, then add the constraint separately
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS comments_id INTEGER;

-- Create index for the new column
CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_comments_id_idx ON payload_locked_documents_rels (comments_id);

-- Add foreign key constraint (using DO block to handle if it already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'payload_locked_documents_rels_comments_fk'
    ) THEN
        ALTER TABLE payload_locked_documents_rels
        ADD CONSTRAINT payload_locked_documents_rels_comments_fk
        FOREIGN KEY (comments_id) REFERENCES comments(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create comments_rels table for relationships (if needed by Payload)
CREATE TABLE IF NOT EXISTS comments_rels (
    id SERIAL PRIMARY KEY,
    "order" INTEGER,
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    path VARCHAR NOT NULL,
    posts_id INTEGER REFERENCES posts(id) ON DELETE SET NULL
);

-- Create indexes for comments_rels
CREATE INDEX IF NOT EXISTS comments_rels_order_idx ON comments_rels ("order");
CREATE INDEX IF NOT EXISTS comments_rels_parent_idx ON comments_rels (parent_id);
CREATE INDEX IF NOT EXISTS comments_rels_path_idx ON comments_rels (path);
CREATE INDEX IF NOT EXISTS comments_rels_posts_id_idx ON comments_rels (posts_id);

-- Create comments version table
CREATE TABLE IF NOT EXISTS _comments_v (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER,
    version_author_name VARCHAR(100),
    version_content TEXT,
    version_approved BOOLEAN DEFAULT false,
    version_ip_address VARCHAR,
    version_updated_at TIMESTAMP(3) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version_created_at TIMESTAMP(3) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    latest BOOLEAN,
    autosave BOOLEAN DEFAULT false,
    created_at TIMESTAMP(3) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for _comments_v
CREATE INDEX IF NOT EXISTS _comments_v_parent_idx ON _comments_v (parent_id);
CREATE INDEX IF NOT EXISTS _comments_v_version_created_at_idx ON _comments_v (version_created_at);
CREATE INDEX IF NOT EXISTS _comments_v_latest_idx ON _comments_v (latest);
CREATE INDEX IF NOT EXISTS _comments_v_autosave_idx ON _comments_v (autosave);

-- Create _comments_v_rels table
CREATE TABLE IF NOT EXISTS _comments_v_rels (
    id SERIAL PRIMARY KEY,
    "order" INTEGER,
    parent_id INTEGER REFERENCES _comments_v(id) ON DELETE CASCADE,
    path VARCHAR NOT NULL,
    posts_id INTEGER REFERENCES posts(id) ON DELETE SET NULL
);

-- Create indexes for _comments_v_rels
CREATE INDEX IF NOT EXISTS _comments_v_rels_order_idx ON _comments_v_rels ("order");
CREATE INDEX IF NOT EXISTS _comments_v_rels_parent_idx ON _comments_v_rels (parent_id);
CREATE INDEX IF NOT EXISTS _comments_v_rels_path_idx ON _comments_v_rels (path);
CREATE INDEX IF NOT EXISTS _comments_v_rels_posts_id_idx ON _comments_v_rels (posts_id);

-- Grant permissions (adjust based on your DB user)
-- GRANT ALL PRIVILEGES ON TABLE comments TO your_db_user;
-- GRANT ALL PRIVILEGES ON TABLE comments_rels TO your_db_user;
-- GRANT ALL PRIVILEGES ON TABLE _comments_v TO your_db_user;
-- GRANT ALL PRIVILEGES ON TABLE _comments_v_rels TO your_db_user;
