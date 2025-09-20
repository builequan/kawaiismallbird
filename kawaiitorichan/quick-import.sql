-- Quick import script for Dokploy deployment
-- Creates minimal schema and inserts sample data to verify functionality

-- Drop existing tables to ensure clean state
DROP TABLE IF EXISTS posts_rels CASCADE;
DROP TABLE IF EXISTS pages_rels CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS pages CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS header CASCADE;
DROP TABLE IF EXISTS footer CASCADE;
DROP TABLE IF EXISTS internal_links_settings CASCADE;
DROP TABLE IF EXISTS affiliate_products CASCADE;
DROP TABLE IF EXISTS payload_migrations CASCADE;
DROP TABLE IF EXISTS payload_migrations_lock CASCADE;

-- Create minimal users table
CREATE TABLE users (
  id serial PRIMARY KEY,
  email varchar NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create categories table
CREATE TABLE categories (
  id serial PRIMARY KEY,
  title varchar NOT NULL,
  slug varchar NOT NULL UNIQUE,
  parent_id integer,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create media table
CREATE TABLE media (
  id serial PRIMARY KEY,
  filename varchar,
  url varchar,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create posts table
CREATE TABLE posts (
  id serial PRIMARY KEY,
  title varchar NOT NULL,
  slug varchar NOT NULL UNIQUE,
  content jsonb,
  status varchar DEFAULT 'published',
  published_at timestamp DEFAULT now(),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create posts_rels table
CREATE TABLE posts_rels (
  id serial PRIMARY KEY,
  parent_id integer,
  path varchar,
  category_id integer
);

-- Create globals
CREATE TABLE header (
  id serial PRIMARY KEY,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE footer (
  id serial PRIMARY KEY,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Insert admin user
INSERT INTO users (email) VALUES ('admin@example.com');

-- Insert sample categories
INSERT INTO categories (title, slug) VALUES
  ('セキセイインコ', 'budgerigar'),
  ('コザクラインコ', 'lovebird'),
  ('オカメインコ', 'cockatiel');

-- Insert sample posts with simple Lexical content
INSERT INTO posts (title, slug, content, status, published_at) VALUES
  ('セキセイインコの飼い方入門', 'budgerigar-care-guide',
   '{"root":{"type":"root","children":[{"type":"paragraph","children":[{"type":"text","text":"セキセイインコは初心者でも飼いやすい小鳥です。"}]}]}}',
   'published', now()),
  ('コザクラインコの特徴', 'lovebird-characteristics',
   '{"root":{"type":"root","children":[{"type":"paragraph","children":[{"type":"text","text":"コザクラインコは愛情深い小鳥として知られています。"}]}]}}',
   'published', now()),
  ('オカメインコのケア', 'cockatiel-care',
   '{"root":{"type":"root","children":[{"type":"paragraph","children":[{"type":"text","text":"オカメインコは頬の赤い模様が特徴的です。"}]}]}}',
   'published', now());

-- Link posts to categories
INSERT INTO posts_rels (parent_id, path, category_id) VALUES
  (1, 'categories', 1),
  (2, 'categories', 2),
  (3, 'categories', 3);

-- Insert globals
INSERT INTO header (id) VALUES (1);
INSERT INTO footer (id) VALUES (1);

-- Verify data was inserted
DO $$
DECLARE
  post_count integer;
  category_count integer;
BEGIN
  SELECT COUNT(*) INTO post_count FROM posts;
  SELECT COUNT(*) INTO category_count FROM categories;

  RAISE NOTICE '✅ Quick import complete: % posts, % categories', post_count, category_count;
END $$;