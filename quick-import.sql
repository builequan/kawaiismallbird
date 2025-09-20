-- Quick import to add sample data if essential_data.sql is not available
-- This adds a few posts to get your site running

-- Insert sample categories if they don't exist
INSERT INTO categories (id, title, slug, "createdAt", "updatedAt") VALUES
(1, 'セキセイインコ', 'budgerigar', NOW(), NOW()),
(2, 'オカメインコ', 'cockatiel', NOW(), NOW()),
(3, '文鳥', 'java-sparrow', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample posts
INSERT INTO posts (id, title, slug, content, "publishedAt", "createdAt", "updatedAt") VALUES
(1, 'セキセイインコの飼い方', 'how-to-care-budgie', '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"セキセイインコは人気のペットバードです。","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}]}}', NOW(), NOW(), NOW()),
(2, 'オカメインコの特徴', 'cockatiel-features', '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"オカメインコは愛らしい冠羽が特徴的です。","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}]}}', NOW(), NOW(), NOW()),
(3, '文鳥の鳴き声について', 'java-sparrow-sounds', '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"文鳥は美しい鳴き声で知られています。","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}]}}', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Link posts to categories
INSERT INTO posts_rels (parent_id, path, category_id) VALUES
(1, 'categories', 1),
(2, 'categories', 2),
(3, 'categories', 3)
ON CONFLICT DO NOTHING;

-- Update sequences
SELECT setval('posts_id_seq', (SELECT MAX(id) FROM posts), true);
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories), true);