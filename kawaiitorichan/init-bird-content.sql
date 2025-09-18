-- Initialize Kawaii Bird Content
-- This SQL script initializes the bird theme content for production

-- Delete existing home and about pages if they exist
DELETE FROM pages WHERE slug IN ('home', 'about-us', 'about');

-- Insert Homepage
INSERT INTO pages (
    id,
    slug,
    title,
    hero,
    layout,
    meta,
    "_status",
    "createdAt",
    "updatedAt"
) VALUES (
    1000001,
    'home',
    'ホーム',
    jsonb_build_object(
        'type', 'lowImpact',
        'richText', jsonb_build_object(
            'root', jsonb_build_object(
                'type', 'root',
                'version', 1,
                'children', jsonb_build_array(
                    jsonb_build_object(
                        'type', 'heading',
                        'tag', 'h1',
                        'version', 1,
                        'children', jsonb_build_array(
                            jsonb_build_object('type', 'text', 'text', 'かわいい鳥の世界へようこそ')
                        )
                    ),
                    jsonb_build_object(
                        'type', 'paragraph',
                        'version', 1,
                        'children', jsonb_build_array(
                            jsonb_build_object('type', 'text', 'text', '小さくてかわいい鳥たちの魅力的な世界を探索しましょう。')
                        )
                    )
                )
            )
        )
    ),
    jsonb_build_array(
        jsonb_build_object(
            'blockType', 'homepageLayout',
            'blockName', 'homepage-content',
            'showMostViewedPosts', true,
            'mostViewedPostsLimit', 6,
            'showRecentPosts', true,
            'recentPostsLimit', 6,
            'showCategories', true,
            'categoriesLimit', 8,
            'sectionOrder', 'categories-viewed-recent',
            'id', 'content-01'
        )
    ),
    jsonb_build_object(
        'title', 'ホーム - Kawaii Bird',
        'description', '小さくてかわいい鳥たちの魅力的な世界を探索するブログサイト'
    ),
    'published',
    NOW(),
    NOW()
) ON CONFLICT (slug) DO UPDATE SET
    hero = EXCLUDED.hero,
    layout = EXCLUDED.layout,
    meta = EXCLUDED.meta,
    title = EXCLUDED.title,
    "_status" = EXCLUDED."_status",
    "updatedAt" = NOW();

-- Insert About Page
INSERT INTO pages (
    id,
    slug,
    title,
    hero,
    layout,
    meta,
    "_status",
    "createdAt",
    "updatedAt"
) VALUES (
    1000002,
    'about-us',
    'わたしたちについて',
    jsonb_build_object(
        'type', 'lowImpact',
        'richText', jsonb_build_object(
            'root', jsonb_build_object(
                'type', 'root',
                'version', 1,
                'children', jsonb_build_array(
                    jsonb_build_object(
                        'type', 'heading',
                        'tag', 'h1',
                        'version', 1,
                        'children', jsonb_build_array(
                            jsonb_build_object('type', 'text', 'text', 'Kawaii Birdについて')
                        )
                    ),
                    jsonb_build_object(
                        'type', 'paragraph',
                        'version', 1,
                        'children', jsonb_build_array(
                            jsonb_build_object('type', 'text', 'text', '小さくてかわいい鳥たちの魅力を伝えるブログです。')
                        )
                    )
                )
            )
        )
    ),
    jsonb_build_array(
        jsonb_build_object(
            'blockType', 'content',
            'id', 'about-content-01',
            'columns', jsonb_build_array(
                jsonb_build_object(
                    'id', 'content-01',
                    'richText', jsonb_build_object(
                        'root', jsonb_build_object(
                            'type', 'root',
                            'version', 1,
                            'children', jsonb_build_array(
                                jsonb_build_object(
                                    'type', 'heading',
                                    'tag', 'h2',
                                    'version', 1,
                                    'children', jsonb_build_array(
                                        jsonb_build_object('type', 'text', 'text', '私たちのミッション')
                                    )
                                ),
                                jsonb_build_object(
                                    'type', 'paragraph',
                                    'version', 1,
                                    'children', jsonb_build_array(
                                        jsonb_build_object('type', 'text', 'text', 'Kawaii Birdは、小鳥たちの可愛らしさと魅力を世界中の人々と共有することを目的としています。')
                                    )
                                )
                            )
                        )
                    )
                )
            )
        )
    ),
    jsonb_build_object(
        'title', '私たちについて - Kawaii Bird',
        'description', '小さくてかわいい鳥たちの魅力を伝えるブログサイト'
    ),
    'published',
    NOW(),
    NOW()
) ON CONFLICT (slug) DO UPDATE SET
    hero = EXCLUDED.hero,
    layout = EXCLUDED.layout,
    meta = EXCLUDED.meta,
    title = EXCLUDED.title,
    "_status" = EXCLUDED."_status",
    "updatedAt" = NOW();

-- Insert Bird Categories
INSERT INTO categories (title, slug, description, color, "_status", "createdAt", "updatedAt")
VALUES
    ('野鳥観察', 'wild-birds', '日本の野鳥の観察記録と写真', 'green', 'published', NOW(), NOW()),
    ('飼い鳥', 'pet-birds', 'インコ、文鳥、カナリアなどの飼い鳥について', 'blue', 'published', NOW(), NOW()),
    ('鳥の写真', 'bird-photos', '美しい鳥たちの写真ギャラリー', 'purple', 'published', NOW(), NOW()),
    ('鳥の生態', 'bird-ecology', '鳥たちの習性と生態について', 'orange', 'published', NOW(), NOW()),
    ('鳥の飼い方', 'bird-care', '小鳥の飼育方法とお世話のコツ', 'pink', 'published', NOW(), NOW()),
    ('鳥の種類', 'bird-species', '様々な鳥の種類と特徴', 'cyan', 'published', NOW(), NOW()),
    ('鳥の健康', 'bird-health', '鳥の健康管理と病気の予防', 'red', 'published', NOW(), NOW()),
    ('鳥のグッズ', 'bird-goods', '鳥用品とおすすめアイテム', 'yellow', 'published', NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    "_status" = EXCLUDED."_status",
    "updatedAt" = NOW();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Kawaii Bird content initialized successfully!';
END $$;