-- Complete Kawaii Bird Content Initialization
-- This ensures production has exact same content as local

-- Delete any existing pages first
DELETE FROM pages WHERE slug IN ('home', 'about-us', 'about');

-- Insert Homepage (from local database)
INSERT INTO public.pages (id, title, hero_type, hero_rich_text, hero_media_id, meta_title, meta_image_id, meta_description, published_at, slug, slug_lock, updated_at, created_at, _status)
VALUES (7, 'かわいい小鳥の世界 - あなたの愛鳥ライフをサポート', 'lowImpact', '{"root": {"type": "root", "format": "", "indent": 0, "version": 1, "children": [{"tag": "h1", "type": "heading", "format": "center", "indent": 0, "version": 1, "children": [{"mode": "normal", "text": "🐦 かわいい小鳥の世界へようこそ 🐦", "type": "text", "style": "", "detail": 0, "format": 1, "version": 1}], "direction": "ltr"}, {"type": "paragraph", "format": "center", "indent": 0, "version": 1, "children": [{"mode": "normal", "text": "日本と世界の美しい小鳥たち - 野鳥観察から飼い鳥まで", "type": "text", "style": "", "detail": 0, "format": 0, "version": 1}], "direction": "ltr"}], "direction": "ltr"}}', NULL, 'かわいい小鳥の世界 - 野鳥観察と飼い鳥の総合情報サイト', NULL, '日本と世界のかわいい小鳥たちの写真、飼い方、生態について。インコ、文鳥、カナリアから野鳥まで、小鳥好きのための総合情報サイト。', '2025-09-18 10:39:14.107+09', 'home', true, '2025-09-18 10:39:14.111+09', '2025-09-18 10:39:14.111+09', 'published')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  hero_type = EXCLUDED.hero_type,
  hero_rich_text = EXCLUDED.hero_rich_text,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  _status = EXCLUDED._status,
  updated_at = NOW();

-- Insert About Us Page (from local database)
INSERT INTO public.pages (id, title, hero_type, hero_rich_text, hero_media_id, meta_title, meta_image_id, meta_description, published_at, slug, slug_lock, updated_at, created_at, _status)
VALUES (4, 'わたしたちについて', 'lowImpact', '{"root": {"type": "root", "format": "", "indent": 0, "version": 1, "children": [{"tag": "h1", "type": "heading", "format": "center", "indent": 0, "version": 1, "children": [{"mode": "normal", "text": "🕊️ かわいい小鳥の世界について 🕊️", "type": "text", "style": "", "detail": 0, "format": 1, "version": 1}], "direction": "ltr"}], "direction": "ltr"}}', NULL, 'わたしたちについて - かわいい小鳥の世界', NULL, '日本と世界のかわいい小鳥たちの魅力を伝える、私たちのミッションとチームについて。', NULL, 'about-us', true, '2025-09-15 14:59:31.213+09', '2025-09-02 14:25:19.974+09', 'published')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  hero_type = EXCLUDED.hero_type,
  hero_rich_text = EXCLUDED.hero_rich_text,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  _status = EXCLUDED._status,
  updated_at = NOW();

-- Update sequence if needed
SELECT setval('public.pages_id_seq', GREATEST(7, (SELECT MAX(id) FROM pages)), true);

-- Verify the pages were created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pages WHERE slug = 'about-us') THEN
    RAISE NOTICE '✅ About Us page created/updated successfully';
  ELSE
    RAISE WARNING '⚠️ Failed to create About Us page';
  END IF;

  IF EXISTS (SELECT 1 FROM pages WHERE slug = 'home') THEN
    RAISE NOTICE '✅ Homepage created/updated successfully';
  ELSE
    RAISE WARNING '⚠️ Failed to create Homepage';
  END IF;
END $$;