-- Database Setup Script for Content Import System
-- Run this in your PostgreSQL database (webblog)

-- Create articles table if it doesn't exist
CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  website_id INTEGER DEFAULT 1,
  language VARCHAR(10) DEFAULT 'en',
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  slug VARCHAR(255),
  meta_description TEXT,
  keywords TEXT,
  category VARCHAR(100),
  tags TEXT[],
  author VARCHAR(100),
  status VARCHAR(20) DEFAULT 'draft',
  featured_image VARCHAR(500),
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_articles_website_id ON articles(website_id);
CREATE INDEX IF NOT EXISTS idx_articles_language ON articles(language);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);

-- Insert sample articles for testing (if table is empty)
INSERT INTO articles (website_id, language, title, content, slug, meta_description, category, tags, author, status, published_at)
SELECT 1, 'en', 'Welcome to Golf Blog',
       'This is a comprehensive guide to getting started with golf. Learn the basics of grip, stance, and swing.',
       'welcome-golf-blog',
       'Start your golf journey with our comprehensive beginner guide',
       'Golf Basics',
       ARRAY['golf', 'beginner', 'tutorial'],
       'John Smith',
       'published',
       NOW() - INTERVAL '7 days'
WHERE NOT EXISTS (SELECT 1 FROM articles LIMIT 1);

INSERT INTO articles (website_id, language, title, content, slug, meta_description, category, tags, author, status, published_at)
SELECT 1, 'en', 'Best Golf Clubs for Beginners',
       'Choosing the right golf clubs is crucial for beginners. This guide covers everything you need to know about selecting your first set.',
       'best-golf-clubs-beginners',
       'Find the perfect golf clubs to start your golfing journey',
       'Equipment',
       ARRAY['golf', 'clubs', 'equipment', 'beginner'],
       'Jane Doe',
       'published',
       NOW() - INTERVAL '5 days'
WHERE NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'best-golf-clubs-beginners');

INSERT INTO articles (website_id, language, title, content, slug, meta_description, category, tags, author, status, published_at)
SELECT 1, 'ja', 'ゴルフスイングの基本',
       'ゴルフスイングの基本を学びましょう。グリップ、スタンス、スイングの動きを詳しく解説します。',
       'golf-swing-basics-ja',
       'ゴルフスイングの基本テクニックを学ぶ',
       'Golf Technique',
       ARRAY['ゴルフ', 'スイング', '基本'],
       'Takeshi Yamada',
       'published',
       NOW() - INTERVAL '3 days'
WHERE NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'golf-swing-basics-ja');

INSERT INTO articles (website_id, language, title, content, slug, meta_description, category, tags, author, status, published_at)
SELECT 2, 'en', 'Golf Course Management Tips',
       'Learn how to manage your way around the golf course. Strategic thinking can save you strokes.',
       'golf-course-management',
       'Strategic tips for better course management',
       'Strategy',
       ARRAY['golf', 'strategy', 'course management'],
       'Mike Wilson',
       'published',
       NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'golf-course-management');

INSERT INTO articles (website_id, language, title, content, slug, meta_description, category, tags, author, status, published_at)
SELECT 2, 'ja', 'パター選びのコツ',
       'パター選びは重要です。自分に合ったパターを見つけるためのポイントを紹介します。',
       'putter-selection-tips-ja',
       'パター選びの重要なポイント',
       'Equipment',
       ARRAY['ゴルフ', 'パター', '道具'],
       'Kenji Sato',
       'draft',
       NULL
WHERE NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'putter-selection-tips-ja');

-- Show article count by website and language
SELECT
    website_id,
    language,
    COUNT(*) as article_count,
    COUNT(CASE WHEN status = 'published' THEN 1 END) as published_count,
    COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count
FROM articles
GROUP BY website_id, language
ORDER BY website_id, language;

-- Show total statistics
SELECT
    COUNT(*) as total_articles,
    COUNT(DISTINCT website_id) as total_websites,
    COUNT(DISTINCT language) as total_languages,
    COUNT(DISTINCT category) as total_categories
FROM articles;