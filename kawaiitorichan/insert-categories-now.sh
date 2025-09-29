#!/bin/sh
# Emergency script to insert categories directly into production database
# Run this once manually to fix the missing categories issue

echo "🔧 Inserting categories into production database..."

# Use the Dokploy database connection
PGPASSWORD=2801 psql -h webblog-kawaiibirddb-gq00ip -p 5432 -U postgres -d kawaii-bird-db <<'EOSQL'
-- Main categories
INSERT INTO categories (id, title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
(1, '🦜 鳥の種類', 'bird-species', '様々な鳥の種類についての情報', 1, true, NULL, NOW(), NOW()),
(2, '🏠 鳥の飼い方', 'bird-care', '鳥の基本的な飼育方法', 2, true, NULL, NOW(), NOW()),
(3, '💊 鳥の健康', 'bird-health', '鳥の健康管理と病気の対処', 3, true, NULL, NOW(), NOW()),
(4, '🌿 鳥の生態', 'bird-behavior', '鳥の行動と生態について', 4, true, NULL, NOW(), NOW()),
(5, '🔭 野鳥観察', 'bird-watching', '野鳥観察の楽しみ方', 5, true, NULL, NOW(), NOW()),
(6, '🥗 餌と栄養', 'nutrition-feeding', '鳥の餌と栄養管理', 6, true, NULL, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, updated_at = NOW();

-- Subcategories for Bird Species (parent_id = 1)
INSERT INTO categories (id, title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
(101, 'セキセイインコ', 'budgerigar', '明るく社交的なセキセイインコ', 1, true, 1, NOW(), NOW()),
(102, 'オカメインコ', 'cockatiel', '優しいオカメインコ', 2, true, 1, NOW(), NOW()),
(103, 'ラブバード', 'lovebird', '愛情深いラブバード', 3, true, 1, NOW(), NOW()),
(104, 'ゼブラフィンチ', 'zebra-finch', 'ゼブラフィンチ', 4, true, 1, NOW(), NOW()),
(105, '文鳥', 'society-finch', '文鳥', 5, true, 1, NOW(), NOW()),
(106, 'ゴシキキンカン', 'gouldian-finch', 'ゴシキキンカン', 6, true, 1, NOW(), NOW()),
(107, 'カナリア', 'canary', 'カナリア', 7, true, 1, NOW(), NOW()),
(108, 'マメルリハ', 'parrotlet', 'マメルリハ', 8, true, 1, NOW(), NOW()),
(109, 'ジュウシマツ', 'munias', 'ジュウシマツ', 9, true, 1, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, parent_id = EXCLUDED.parent_id, updated_at = NOW();

-- Subcategories for Bird Care (parent_id = 2)
INSERT INTO categories (id, title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
(201, 'ケージと飼育環境', 'housing-enclosures', 'ケージの選び方', 1, true, 2, NOW(), NOW()),
(202, 'ケージサイズと設置', 'cage-setup', 'ケージのサイズ', 2, true, 2, NOW(), NOW()),
(203, '止まり木と設備', 'perches-accessories', '止まり木', 3, true, 2, NOW(), NOW()),
(204, '温度と湿度管理', 'temperature-humidity', '温度管理', 4, true, 2, NOW(), NOW()),
(205, '照明設備', 'lighting', '照明', 5, true, 2, NOW(), NOW()),
(206, '清掃と衛生管理', 'cleaning-hygiene', '清掃', 6, true, 2, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, parent_id = EXCLUDED.parent_id, updated_at = NOW();

-- Subcategories for Bird Health (parent_id = 3)
INSERT INTO categories (id, title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
(301, '日常の健康管理', 'daily-health-care', '健康チェック', 1, true, 3, NOW(), NOW()),
(302, '病気の症状と対処', 'illness-treatment', '病気の対処', 2, true, 3, NOW(), NOW()),
(303, '応急処置', 'emergency-care', '応急処置', 3, true, 3, NOW(), NOW()),
(304, '獣医師の診察', 'veterinary-care', '獣医師', 4, true, 3, NOW(), NOW()),
(305, '換羽期のケア', 'molting-care', '換羽期', 5, true, 3, NOW(), NOW()),
(306, '繁殖と産卵', 'breeding-care', '繁殖', 6, true, 3, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, parent_id = EXCLUDED.parent_id, updated_at = NOW();

-- Subcategories for Bird Behavior (parent_id = 4)
INSERT INTO categories (id, title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
(401, '鳴き声と意思疎通', 'vocalizations', '鳴き声', 1, true, 4, NOW(), NOW()),
(402, '行動パターン', 'behavior-patterns', '行動', 2, true, 4, NOW(), NOW()),
(403, 'しつけと訓練', 'training', 'しつけ', 3, true, 4, NOW(), NOW()),
(404, 'ストレス管理', 'stress-management', 'ストレス', 4, true, 4, NOW(), NOW()),
(405, '社会性と多頭飼い', 'social-behavior', '社会性', 5, true, 4, NOW(), NOW()),
(406, '遊びと運動', 'play-exercise', '遊び', 6, true, 4, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, parent_id = EXCLUDED.parent_id, updated_at = NOW();

-- Subcategories for Bird Watching (parent_id = 5)
INSERT INTO categories (id, title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
(501, '観察の基本', 'observation-basics', '観察基本', 1, true, 5, NOW(), NOW()),
(502, '観察場所', 'observation-locations', '観察場所', 2, true, 5, NOW(), NOW()),
(503, '観察用具', 'observation-equipment', '観察用具', 3, true, 5, NOW(), NOW()),
(504, '季節別観察', 'seasonal-observation', '季節別', 4, true, 5, NOW(), NOW()),
(505, '記録と写真', 'recording-photography', '記録', 5, true, 5, NOW(), NOW()),
(506, '保護と環境', 'conservation', '保護', 6, true, 5, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, parent_id = EXCLUDED.parent_id, updated_at = NOW();

-- Subcategories for Nutrition (parent_id = 6)
INSERT INTO categories (id, title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
(601, '基本的な餌', 'basic-diet', '基本的な餌', 1, true, 6, NOW(), NOW()),
(602, '新鮮な野菜と果物', 'fresh-foods', '野菜と果物', 2, true, 6, NOW(), NOW()),
(603, 'タンパク質源', 'protein-sources', 'タンパク質', 3, true, 6, NOW(), NOW()),
(604, 'サプリメント', 'supplements', 'サプリメント', 4, true, 6, NOW(), NOW()),
(605, '危険な食べ物', 'toxic-foods', '危険な食べ物', 5, true, 6, NOW(), NOW()),
(606, '給餌スケジュール', 'feeding-schedule', '給餌', 6, true, 6, NOW(), NOW()),
(607, '水分補給', 'hydration', '水分', 7, true, 6, NOW(), NOW()),
(608, '季節別の栄養', 'seasonal-nutrition', '季節別栄養', 8, true, 6, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, parent_id = EXCLUDED.parent_id, updated_at = NOW();
EOSQL

if [ $? -eq 0 ]; then
  echo "✅ Categories inserted successfully!"
  echo "📊 Checking category count..."
  PGPASSWORD=2801 psql -h webblog-kawaiibirddb-gq00ip -p 5432 -U postgres -d kawaii-bird-db -t -c "SELECT COUNT(*) FROM categories;"
else
  echo "❌ Failed to insert categories!"
  exit 1
fi