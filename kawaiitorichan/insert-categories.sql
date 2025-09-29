-- Complete bird categories based on website header navigation
-- Main categories and subcategories with proper hierarchy

-- 1. 鳥の種類 (Bird Species) - Parent ID: 1
INSERT INTO categories (id, title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
(1, '🦜 鳥の種類', 'bird-species', '様々な鳥の種類についての情報', 1, true, NULL, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, updated_at = NOW();

INSERT INTO categories (id, title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
(101, 'セキセイインコ', 'budgerigar', '明るく社交的なセキセイインコに関する記事', 1, true, 1, NOW(), NOW()),
(102, 'オカメインコ', 'cockatiel', '優しいオカメインコのケア情報', 2, true, 1, NOW(), NOW()),
(103, 'ラブバード', 'lovebird', '愛情深いラブバードについての情報', 3, true, 1, NOW(), NOW()),
(104, 'ゼブラフィンチ', 'zebra-finch', 'ゼブラフィンチの飼育情報', 4, true, 1, NOW(), NOW()),
(105, '文鳥', 'society-finch', '文鳥の飼い方と特徴', 5, true, 1, NOW(), NOW()),
(106, 'ゴシキキンカン', 'gouldian-finch', '美しいゴシキキンカンの情報', 6, true, 1, NOW(), NOW()),
(107, 'カナリア', 'canary', 'カナリアの飼育と鳴き声', 7, true, 1, NOW(), NOW()),
(108, 'マメルリハ', 'parrotlet', '小さくて可愛いマメルリハ', 8, true, 1, NOW(), NOW()),
(109, 'ジュウシマツ', 'munias', 'ジュウシマツの飼育情報', 9, true, 1, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, parent_id = EXCLUDED.parent_id, updated_at = NOW();

-- 2. 鳥の飼い方 (Bird Care) - Parent ID: 2
INSERT INTO categories (id, title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
(2, '🏠 鳥の飼い方', 'bird-care', '鳥の基本的な飼育方法', 2, true, NULL, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, updated_at = NOW();

INSERT INTO categories (id, title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
(201, 'ケージと飼育環境', 'housing-enclosures', 'ケージの選び方と環境作り', 1, true, 2, NOW(), NOW()),
(202, 'ケージサイズと設置', 'cage-setup', 'ケージのサイズと設置場所', 2, true, 2, NOW(), NOW()),
(203, '止まり木と設備', 'perches-accessories', '止まり木とアクセサリー', 3, true, 2, NOW(), NOW()),
(204, '温度と湿度管理', 'temperature-humidity', '適切な温度と湿度の管理', 4, true, 2, NOW(), NOW()),
(205, '照明設備', 'lighting', '照明の重要性と設置方法', 5, true, 2, NOW(), NOW()),
(206, '清掃と衛生管理', 'cleaning-hygiene', 'ケージの清掃と衛生管理', 6, true, 2, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, parent_id = EXCLUDED.parent_id, updated_at = NOW();

-- 3. 鳥の健康 (Bird Health) - Parent ID: 3
INSERT INTO categories (id, title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
(3, '💊 鳥の健康', 'bird-health', '鳥の健康管理と病気の対処', 3, true, NULL, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, updated_at = NOW();

INSERT INTO categories (id, title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
(301, '日常の健康管理', 'daily-health-care', '毎日の健康チェック方法', 1, true, 3, NOW(), NOW()),
(302, '病気の症状と対処', 'illness-treatment', '病気のサインと治療方法', 2, true, 3, NOW(), NOW()),
(303, '応急処置', 'emergency-care', '緊急時の応急処置', 3, true, 3, NOW(), NOW()),
(304, '獣医師の診察', 'veterinary-care', '獣医師による診察', 4, true, 3, NOW(), NOW()),
(305, '換羽期のケア', 'molting-care', '換羽期の特別なケア', 5, true, 3, NOW(), NOW()),
(306, '繁殖と産卵', 'breeding-care', '繁殖と産卵のケア', 6, true, 3, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, parent_id = EXCLUDED.parent_id, updated_at = NOW();

-- 4. 鳥の生態 (Bird Behavior) - Parent ID: 4
INSERT INTO categories (id, title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
(4, '🌿 鳥の生態', 'bird-behavior', '鳥の行動と生態について', 4, true, NULL, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, updated_at = NOW();

INSERT INTO categories (id, title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
(401, '鳴き声と意思疎通', 'vocalizations', '鳴き声によるコミュニケーション', 1, true, 4, NOW(), NOW()),
(402, '行動パターン', 'behavior-patterns', '鳥の行動パターンの理解', 2, true, 4, NOW(), NOW()),
(403, 'しつけと訓練', 'training', 'しつけと訓練の方法', 3, true, 4, NOW(), NOW()),
(404, 'ストレス管理', 'stress-management', 'ストレスの原因と対処', 4, true, 4, NOW(), NOW()),
(405, '社会性と多頭飼い', 'social-behavior', '社会性と複数飼育', 5, true, 4, NOW(), NOW()),
(406, '遊びと運動', 'play-exercise', '遊びと運動の重要性', 6, true, 4, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, parent_id = EXCLUDED.parent_id, updated_at = NOW();

-- 5. 野鳥観察 (Bird Watching) - Parent ID: 5
INSERT INTO categories (id, title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
(5, '🔭 野鳥観察', 'bird-watching', '野鳥観察の楽しみ方', 5, true, NULL, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, updated_at = NOW();

INSERT INTO categories (id, title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
(501, '観察の基本', 'observation-basics', '野鳥観察の基本知識', 1, true, 5, NOW(), NOW()),
(502, '観察場所', 'observation-locations', '観察に適した場所', 2, true, 5, NOW(), NOW()),
(503, '観察用具', 'observation-equipment', '必要な観察用具', 3, true, 5, NOW(), NOW()),
(504, '季節別観察', 'seasonal-observation', '季節ごとの観察ポイント', 4, true, 5, NOW(), NOW()),
(505, '記録と写真', 'recording-photography', '記録と写真撮影', 5, true, 5, NOW(), NOW()),
(506, '保護と環境', 'conservation', '野鳥保護と環境保全', 6, true, 5, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, parent_id = EXCLUDED.parent_id, updated_at = NOW();

-- 6. 餌と栄養 (Nutrition & Feeding) - Parent ID: 6
INSERT INTO categories (id, title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
(6, '🥗 餌と栄養', 'nutrition-feeding', '鳥の餌と栄養管理', 6, true, NULL, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, updated_at = NOW();

INSERT INTO categories (id, title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
(601, '基本的な餌', 'basic-diet', '基本的な餌の種類', 1, true, 6, NOW(), NOW()),
(602, '新鮮な野菜と果物', 'fresh-foods', '野菜と果物の与え方', 2, true, 6, NOW(), NOW()),
(603, 'タンパク質源', 'protein-sources', 'タンパク質の重要性', 3, true, 6, NOW(), NOW()),
(604, 'サプリメント', 'supplements', 'サプリメントの使用', 4, true, 6, NOW(), NOW()),
(605, '危険な食べ物', 'toxic-foods', '与えてはいけない食べ物', 5, true, 6, NOW(), NOW()),
(606, '給餌スケジュール', 'feeding-schedule', '給餌のスケジュール', 6, true, 6, NOW(), NOW()),
(607, '水分補給', 'hydration', '水分補給の重要性', 7, true, 6, NOW(), NOW()),
(608, '季節別の栄養', 'seasonal-nutrition', '季節に応じた栄養管理', 8, true, 6, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, parent_id = EXCLUDED.parent_id, updated_at = NOW();