-- Insert basic bird categories for Japanese bird website
INSERT INTO categories (id, title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
(1, 'セキセイインコ', 'budgerigar', '明るく社交的なセキセイインコに関する記事', 1, true, NULL, NOW(), NOW()),
(2, 'コザクラインコ', 'lovebird', '愛情深いコザクラインコについての情報', 2, true, NULL, NOW(), NOW()),
(3, 'オカメインコ', 'cockatiel', '優しいオカメインコのケア情報', 3, true, NULL, NOW(), NOW()),
(4, 'ボタンインコ', 'fischer-lovebird', 'カラフルなボタンインコの飼育ガイド', 4, true, NULL, NOW(), NOW()),
(5, 'マメルリハ', 'parrotlet', '小さくて可愛いマメルリハの情報', 5, true, NULL, NOW(), NOW()),
(6, 'サザナミインコ', 'lineolated-parakeet', '穏やかなサザナミインコについて', 6, true, NULL, NOW(), NOW()),
(7, 'アキクサインコ', 'bourkes-parakeet', '優雅なアキクサインコのケア', 7, true, NULL, NOW(), NOW()),
(8, 'ウロコインコ', 'green-cheek-conure', '活発なウロコインコの情報', 8, true, NULL, NOW(), NOW()),
(9, 'オウム', 'cockatoo', '知的なオウムの飼育方法', 9, true, NULL, NOW(), NOW()),
(10, 'インコ一般', 'general-parrots', 'インコ全般の情報', 10, true, NULL, NOW(), NOW()),
(11, '小鳥の健康', 'bird-health', '小鳥の健康管理とケア', 11, true, NULL, NOW(), NOW()),
(12, '小鳥の飼育', 'bird-care', '小鳥の飼育方法とヒント', 12, true, NULL, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at = NOW();