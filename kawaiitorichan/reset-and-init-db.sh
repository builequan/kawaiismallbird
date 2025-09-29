#!/bin/sh
# Complete database reset and initialization script
# This ensures the database has the correct schema with all required columns

echo "🔄 COMPLETE DATABASE RESET AND INITIALIZATION" >&2

# Parse DATABASE_URI
if [ -n "$DATABASE_URI" ]; then
  export DB_USER=$(echo $DATABASE_URI | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  export DB_PASSWORD=$(echo $DATABASE_URI | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
  export DB_HOST=$(echo $DATABASE_URI | sed -n 's/.*@\([^:]*\):.*/\1/p')
  export DB_PORT=$(echo $DATABASE_URI | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  export DB_NAME=$(echo $DATABASE_URI | sed -n 's/.*\/\([^?]*\).*/\1/p')
fi

echo "🗑️ Dropping all tables to start fresh..." >&2

# Drop all tables in public schema
PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF 2>&1 | head -20
DO \$\$ DECLARE
    r RECORD;
BEGIN
    -- Disable foreign key checks
    EXECUTE 'SET session_replication_role = replica';

    -- Drop all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;

    -- Drop all types
    FOR r IN (SELECT typname FROM pg_type WHERE typtype = 'e' AND typnamespace = 'public'::regnamespace) LOOP
        EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;

    -- Re-enable foreign key checks
    EXECUTE 'SET session_replication_role = DEFAULT';
END \$\$;
EOF

echo "✅ All tables dropped" >&2

echo "🏗️ Creating schema with ENUMs..." >&2

# Create the complete schema with ENUMs and _status column
PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<'EOF' 2>&1 | head -20
-- Create ENUM types FIRST
CREATE TYPE enum_posts_status AS ENUM ('draft', 'published');
CREATE TYPE enum_posts_language AS ENUM ('ja', 'en');
CREATE TYPE enum_posts_wordpress_metadata_status AS ENUM ('publish', 'draft', 'private', 'pending');
CREATE TYPE enum_pages_status AS ENUM ('draft', 'published');
CREATE TYPE enum_pages_hero_type AS ENUM ('none', 'simple');

-- Create sequences
CREATE SEQUENCE posts_id_seq;
CREATE SEQUENCE media_id_seq;
CREATE SEQUENCE categories_id_seq;
CREATE SEQUENCE tags_id_seq;
CREATE SEQUENCE users_id_seq;
CREATE SEQUENCE pages_id_seq;
CREATE SEQUENCE payload_migrations_id_seq;
CREATE SEQUENCE payload_preferences_id_seq;
CREATE SEQUENCE payload_locked_documents_id_seq;
CREATE SEQUENCE posts_rels_id_seq;

-- Create categories table
CREATE TABLE categories (
    id integer NOT NULL DEFAULT nextval('categories_id_seq'::regclass),
    title character varying,
    slug character varying,
    slug_lock boolean DEFAULT true,
    parent_id integer,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    description text,
    "order" character varying,
    CONSTRAINT categories_pkey PRIMARY KEY (id)
);

-- Create media table
CREATE TABLE media (
    id integer NOT NULL DEFAULT nextval('media_id_seq'::regclass),
    alt text,
    _key character varying,
    prefix character varying DEFAULT 'media',
    filename character varying,
    mime_type character varying,
    filesize numeric,
    width numeric,
    height numeric,
    focal_x numeric,
    focal_y numeric,
    url character varying,
    thumbnail_u_r_l character varying,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    CONSTRAINT media_pkey PRIMARY KEY (id)
);

-- Create posts table WITH _status column
CREATE TABLE posts (
    id integer NOT NULL DEFAULT nextval('posts_id_seq'::regclass),
    title character varying,
    hero_image_id integer REFERENCES media(id),
    content jsonb,
    meta_title character varying,
    meta_image_id integer REFERENCES media(id),
    meta_description character varying,
    published_at timestamp(3) with time zone,
    slug character varying,
    slug_lock boolean DEFAULT true,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    _status enum_posts_status DEFAULT 'published'::enum_posts_status NOT NULL,
    excerpt jsonb,
    language enum_posts_language DEFAULT 'ja'::enum_posts_language NOT NULL,
    hero_image_alt character varying,
    meta_keywords character varying,
    meta_focus_keyphrase character varying,
    wordpress_metadata_original_author character varying,
    wordpress_metadata_original_date timestamp(3) with time zone,
    wordpress_metadata_modified_date timestamp(3) with time zone,
    wordpress_metadata_status enum_posts_wordpress_metadata_status,
    wordpress_metadata_enable_comments boolean DEFAULT true,
    wordpress_metadata_enable_toc boolean DEFAULT true,
    internal_links_metadata_version character varying,
    internal_links_metadata_last_processed timestamp(3) with time zone,
    internal_links_metadata_content_hash character varying,
    affiliate_links_metadata_version character varying,
    affiliate_links_metadata_last_processed timestamp(3) with time zone,
    affiliate_links_metadata_content_hash character varying,
    affiliate_links_metadata_exclude_from_affiliates boolean,
    content_db_meta_original_id character varying,
    content_db_meta_website_id numeric,
    content_db_meta_language character varying,
    content_db_meta_imported_at timestamp(3) with time zone,
    CONSTRAINT posts_pkey PRIMARY KEY (id)
);

-- Create posts_rels table
CREATE TABLE posts_rels (
    id integer NOT NULL DEFAULT nextval('posts_rels_id_seq'::regclass),
    parent_id integer NOT NULL,
    path character varying NOT NULL,
    categories_id integer REFERENCES categories(id),
    tags_id integer,
    populated_authors_id integer,
    affiliate_links_metadata_links_added_id integer,
    internal_links_metadata_links_added_id integer,
    media_id integer REFERENCES media(id),
    CONSTRAINT posts_rels_pkey PRIMARY KEY (id)
);

-- Create other required tables
CREATE TABLE users (
    id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    email character varying,
    reset_password_token character varying,
    reset_password_expiration timestamp(3) with time zone,
    salt character varying,
    hash character varying,
    login_attempts numeric DEFAULT 0,
    lock_until timestamp(3) with time zone,
    enable_a_p_i_key boolean,
    api_key character varying,
    api_key_index character varying,
    CONSTRAINT users_pkey PRIMARY KEY (id)
);

CREATE TABLE tags (
    id integer NOT NULL DEFAULT nextval('tags_id_seq'::regclass),
    title character varying,
    slug character varying,
    slug_lock boolean DEFAULT true,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tags_pkey PRIMARY KEY (id)
);

CREATE TABLE pages (
    id integer NOT NULL DEFAULT nextval('pages_id_seq'::regclass),
    title character varying,
    hero_type enum_pages_hero_type DEFAULT 'none'::enum_pages_hero_type,
    hero_rich_text jsonb,
    hero_links jsonb,
    hero_media_id integer REFERENCES media(id),
    layout jsonb,
    slug character varying,
    slug_lock boolean DEFAULT true,
    meta_title character varying,
    meta_image_id integer REFERENCES media(id),
    meta_description character varying,
    published_at timestamp(3) with time zone,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    _status enum_pages_status DEFAULT 'draft'::enum_pages_status,
    CONSTRAINT pages_pkey PRIMARY KEY (id)
);

-- Create Payload system tables
CREATE TABLE payload_migrations (
    id integer NOT NULL DEFAULT nextval('payload_migrations_id_seq'::regclass),
    name character varying,
    batch numeric,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    CONSTRAINT payload_migrations_pkey PRIMARY KEY (id)
);

CREATE TABLE payload_preferences (
    id integer NOT NULL DEFAULT nextval('payload_preferences_id_seq'::regclass),
    key character varying,
    value jsonb,
    updated_at timestamp(3) with time zone DEFAULT now(),
    created_at timestamp(3) with time zone DEFAULT now(),
    CONSTRAINT payload_preferences_pkey PRIMARY KEY (id)
);

CREATE TABLE payload_preferences_rels (
    id SERIAL PRIMARY KEY,
    parent_id integer NOT NULL,
    path character varying NOT NULL,
    users_id integer REFERENCES users(id)
);

CREATE TABLE payload_locked_documents (
    id integer NOT NULL DEFAULT nextval('payload_locked_documents_id_seq'::regclass),
    global_slug character varying,
    updated_at timestamp(3) with time zone DEFAULT now(),
    created_at timestamp(3) with time zone DEFAULT now(),
    CONSTRAINT payload_locked_documents_pkey PRIMARY KEY (id)
);

CREATE TABLE payload_locked_documents_rels (
    id SERIAL PRIMARY KEY,
    parent_id integer NOT NULL,
    path character varying NOT NULL,
    posts_id integer REFERENCES posts(id),
    pages_id integer REFERENCES pages(id),
    media_id integer REFERENCES media(id),
    categories_id integer REFERENCES categories(id),
    tags_id integer REFERENCES tags(id),
    users_id integer REFERENCES users(id)
);

-- Create indexes
CREATE INDEX posts_created_at_idx ON posts (created_at);
CREATE INDEX posts_updated_at_idx ON posts (updated_at);
CREATE INDEX posts_slug_idx ON posts (slug);
CREATE INDEX posts__status_idx ON posts (_status);
CREATE INDEX posts_language_idx ON posts (language);

-- Insert migration record
INSERT INTO payload_migrations (name, batch, created_at, updated_at)
VALUES ('00-init-db', 1, now(), now());

EOF

echo "✅ Schema created with _status column" >&2

# Verify the _status column exists
echo "🔍 Verifying _status column exists..." >&2
COLUMN_CHECK=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'posts' AND column_name = '_status';" 2>/dev/null)

if [ -n "$COLUMN_CHECK" ]; then
  echo "✅ _status column exists!" >&2
else
  echo "❌ ERROR: _status column was not created!" >&2
  exit 1
fi

echo "🎉 Database reset complete and ready for data import" >&2