-- Complete schema for Payload CMS posts table with ALL fields
DROP TABLE IF EXISTS posts_rels CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS header CASCADE;
DROP TABLE IF EXISTS footer CASCADE;

CREATE TABLE users (
  id serial PRIMARY KEY,
  email varchar NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE categories (
  id serial PRIMARY KEY,
  title varchar NOT NULL,
  slug varchar NOT NULL UNIQUE,
  parent_id integer,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE media (
  id serial PRIMARY KEY,
  filename varchar,
  url varchar,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Complete posts table with ALL fields from the error messages
CREATE TABLE posts (
  id serial PRIMARY KEY,
  title varchar NOT NULL,
  slug varchar NOT NULL UNIQUE,
  excerpt text,
  language varchar,
  hero_image_id integer,
  hero_image_alt varchar,
  content jsonb,
  meta_title varchar,
  meta_image_id integer,
  meta_description varchar,
  meta_keywords varchar,
  meta_focus_keyphrase varchar,

  -- WordPress metadata fields
  wordpress_metadata_original_author varchar,
  wordpress_metadata_original_date timestamp,
  wordpress_metadata_modified_date timestamp,
  wordpress_metadata_status varchar,
  wordpress_metadata_enable_comments boolean DEFAULT false,
  wordpress_metadata_enable_toc boolean DEFAULT false,

  -- Internal links metadata
  internal_links_metadata_version integer DEFAULT 0,
  internal_links_metadata_last_processed timestamp,
  internal_links_metadata_content_hash varchar,

  -- Content DB metadata
  content_db_meta_original_id integer,
  content_db_meta_website_id integer,
  content_db_meta_language varchar,
  content_db_meta_imported_at timestamp,

  -- Affiliate links metadata
  affiliate_links_metadata_version integer DEFAULT 0,
  affiliate_links_metadata_last_processed timestamp,
  affiliate_links_metadata_link_count integer DEFAULT 0,

  _status varchar DEFAULT 'published',
  published_at timestamp DEFAULT now(),
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE posts_rels (
  id serial PRIMARY KEY,
  parent_id integer,
  path varchar,
  category_id integer
);

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

INSERT INTO users (email) VALUES ('admin@example.com');

INSERT INTO categories (title, slug) VALUES
  ('セキセイインコ', 'budgerigar'),
  ('コザクラインコ', 'lovebird'),
  ('オカメインコ', 'cockatiel');

INSERT INTO posts (
  title, slug, excerpt, content, _status, published_at,
  meta_title, meta_description, language,
  wordpress_metadata_enable_comments, wordpress_metadata_enable_toc,
  internal_links_metadata_version, affiliate_links_metadata_version
) VALUES
  ('セキセイインコの飼い方入門', 'budgerigar-care-guide',
   'セキセイインコは初心者でも飼いやすい小鳥です。',
   '{"root":{"type":"root","children":[{"type":"paragraph","children":[{"type":"text","text":"セキセイインコは初心者でも飼いやすい小鳥です。明るく活発な性格で、飼い主とのコミュニケーションも楽しめます。"}]}]}}',
   'published', now(),
   'セキセイインコの飼い方入門 - かわいい小鳥ブログ',
   'セキセイインコの基本的な飼い方を初心者向けに解説します。',
   'ja', false, false, 0, 0),

  ('コザクラインコの特徴', 'lovebird-characteristics',
   'コザクラインコは愛情深い小鳥として知られています。',
   '{"root":{"type":"root","children":[{"type":"paragraph","children":[{"type":"text","text":"コザクラインコは愛情深い小鳥として知られています。パートナーへの愛情が深く、ラブバードとも呼ばれます。"}]}]}}',
   'published', now(),
   'コザクラインコの特徴 - かわいい小鳥ブログ',
   'コザクラインコの性格や特徴について詳しく解説します。',
   'ja', false, false, 0, 0),

  ('オカメインコのケア', 'cockatiel-care',
   'オカメインコは頬の赤い模様が特徴的です。',
   '{"root":{"type":"root","children":[{"type":"paragraph","children":[{"type":"text","text":"オカメインコは頬の赤い模様が特徴的です。優しい性格で初心者にもおすすめの鳥です。"}]}]}}',
   'published', now(),
   'オカメインコのケア方法 - かわいい小鳥ブログ',
   'オカメインコの日常的なケア方法について説明します。',
   'ja', false, false, 0, 0);

INSERT INTO posts_rels (parent_id, path, category_id) VALUES
  (1, 'categories', 1),
  (2, 'categories', 2),
  (3, 'categories', 3);

INSERT INTO header (id) VALUES (1);
INSERT INTO footer (id) VALUES (1);

-- Verify
DO $$
DECLARE
  post_count integer;
  category_count integer;
BEGIN
  SELECT COUNT(*) INTO post_count FROM posts;
  SELECT COUNT(*) INTO category_count FROM categories;
  RAISE NOTICE '✅ Complete schema import: % posts, % categories', post_count, category_count;
END $$;