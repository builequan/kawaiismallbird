-- Direct database initialization for Payload CMS v3 with PostgreSQL
-- This creates all necessary tables when migrations can't run

-- Create payload_migrations table first (required for tracking migrations)
CREATE TABLE IF NOT EXISTS "payload_migrations" (
  "id" serial PRIMARY KEY,
  "name" varchar,
  "batch" integer,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create payload_migrations_lock table
CREATE TABLE IF NOT EXISTS "payload_migrations_lock" (
  "id" serial PRIMARY KEY,
  "is_locked" integer,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY,
  "name" varchar,
  "email" varchar NOT NULL,
  "password" varchar,
  "salt" varchar,
  "hash" varchar,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create categories table
CREATE TABLE IF NOT EXISTS "categories" (
  "id" serial PRIMARY KEY,
  "title" varchar NOT NULL,
  "slug" varchar NOT NULL,
  "parent_id" integer,
  "meta_title" varchar,
  "meta_description" varchar,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  UNIQUE("slug")
);

-- Create tags table
CREATE TABLE IF NOT EXISTS "tags" (
  "id" serial PRIMARY KEY,
  "title" varchar NOT NULL,
  "slug" varchar NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  UNIQUE("slug")
);

-- Create media table
CREATE TABLE IF NOT EXISTS "media" (
  "id" serial PRIMARY KEY,
  "alt" varchar,
  "prefix" varchar DEFAULT 'media',
  "filename" varchar,
  "mime_type" varchar,
  "file_size" numeric,
  "width" numeric,
  "height" numeric,
  "focal_x" numeric,
  "focal_y" numeric,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "url" varchar
);

-- Create posts table
CREATE TABLE IF NOT EXISTS "posts" (
  "id" serial PRIMARY KEY,
  "title" varchar NOT NULL,
  "slug" varchar NOT NULL,
  "content" jsonb,
  "status" varchar DEFAULT 'draft',
  "published_at" timestamp,
  "meta_title" varchar,
  "meta_description" varchar,
  "meta_image_id" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "wp_post_id" integer,
  "wp_guid" varchar,
  "wp_post_date" timestamp,
  "wp_post_modified" timestamp,
  "wp_post_name" varchar,
  "wp_post_type" varchar,
  "wp_post_status" varchar,
  "wp_comment_status" varchar,
  "wp_ping_status" varchar,
  UNIQUE("slug")
);

-- Create pages table
CREATE TABLE IF NOT EXISTS "pages" (
  "id" serial PRIMARY KEY,
  "title" varchar NOT NULL,
  "slug" varchar NOT NULL,
  "content" jsonb,
  "status" varchar DEFAULT 'draft',
  "published_at" timestamp,
  "meta_title" varchar,
  "meta_description" varchar,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  UNIQUE("slug")
);

-- Create posts_rels table for relationships
CREATE TABLE IF NOT EXISTS "posts_rels" (
  "id" serial PRIMARY KEY,
  "order" integer,
  "parent_id" integer NOT NULL,
  "path" varchar NOT NULL,
  "category_id" integer,
  "tag_id" integer,
  "post_id" integer,
  "user_id" integer
);

-- Create pages_rels table
CREATE TABLE IF NOT EXISTS "pages_rels" (
  "id" serial PRIMARY KEY,
  "order" integer,
  "parent_id" integer NOT NULL,
  "path" varchar NOT NULL,
  "page_id" integer
);

-- Create affiliate_products table
CREATE TABLE IF NOT EXISTS "affiliate_products" (
  "id" serial PRIMARY KEY,
  "name" varchar NOT NULL,
  "keyword" varchar NOT NULL,
  "product_type" varchar,
  "description" varchar,
  "affiliate_url" varchar,
  "clean_url" varchar,
  "image_url" varchar,
  "is_primary" boolean DEFAULT false,
  "link_count" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create header global
CREATE TABLE IF NOT EXISTS "header" (
  "id" serial PRIMARY KEY,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create footer global
CREATE TABLE IF NOT EXISTS "footer" (
  "id" serial PRIMARY KEY,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create internal_links_settings global
CREATE TABLE IF NOT EXISTS "internal_links_settings" (
  "id" serial PRIMARY KEY,
  "enabled" boolean DEFAULT true,
  "max_links_per_post" integer DEFAULT 5,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Insert initial globals
INSERT INTO "header" (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
INSERT INTO "footer" (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
INSERT INTO "internal_links_settings" (id, enabled, max_links_per_post) VALUES (1, true, 5) ON CONFLICT (id) DO NOTHING;

-- Mark as if migration has run
INSERT INTO "payload_migrations" (name, batch)
VALUES ('20250920_032655', 1)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "posts_slug_idx" ON "posts" ("slug");
CREATE INDEX IF NOT EXISTS "posts_status_idx" ON "posts" ("status");
CREATE INDEX IF NOT EXISTS "posts_published_at_idx" ON "posts" ("published_at");
CREATE INDEX IF NOT EXISTS "categories_slug_idx" ON "categories" ("slug");
CREATE INDEX IF NOT EXISTS "tags_slug_idx" ON "tags" ("slug");
CREATE INDEX IF NOT EXISTS "pages_slug_idx" ON "pages" ("slug");
CREATE INDEX IF NOT EXISTS "media_filename_idx" ON "media" ("filename");
CREATE INDEX IF NOT EXISTS "posts_rels_parent_idx" ON "posts_rels" ("parent_id");
CREATE INDEX IF NOT EXISTS "posts_rels_path_idx" ON "posts_rels" ("path");