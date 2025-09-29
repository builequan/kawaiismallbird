import { NextResponse } from 'next/server'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await getPayload({ config: configPromise })

    // Execute raw SQL to insert categories
    const result = await payload.db.drizzle.execute(sql`
      -- Main categories
      INSERT INTO categories (title, slug, description, "order", slug_lock, created_at, updated_at) VALUES
      ('🦜 鳥の種類', 'bird-species', '様々な鳥の種類についての情報', 1, true, NOW(), NOW()),
      ('🏠 鳥の飼い方', 'bird-care', '鳥の基本的な飼育方法', 2, true, NOW(), NOW()),
      ('💊 鳥の健康', 'bird-health', '鳥の健康管理と病気の対処', 3, true, NOW(), NOW()),
      ('🌿 鳥の生態', 'bird-behavior', '鳥の行動と生態について', 4, true, NOW(), NOW()),
      ('🔭 野鳥観察', 'bird-watching', '野鳥観察の楽しみ方', 5, true, NOW(), NOW()),
      ('🥗 餌と栄養', 'nutrition-feeding', '鳥の餌と栄養管理', 6, true, NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING
      RETURNING id, slug;
    `)

    // Get the parent IDs
    const parents = await payload.db.drizzle.execute(sql`
      SELECT id, slug FROM categories WHERE parent_id IS NULL ORDER BY "order";
    `)

    // Create a map of slug -> id
    const parentMap: Record<string, number> = {}
    for (const row of parents.rows) {
      parentMap[row.slug as string] = row.id as number
    }

    // Insert subcategories - Bird Species
    await payload.db.drizzle.execute(sql`
      INSERT INTO categories (title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
      ('セキセイインコ', 'budgerigar', '明るく社交的なセキセイインコ', 1, true, ${parentMap['bird-species']}, NOW(), NOW()),
      ('オカメインコ', 'cockatiel', '優しいオカメインコ', 2, true, ${parentMap['bird-species']}, NOW(), NOW()),
      ('ラブバード', 'lovebird', '愛情深いラブバード', 3, true, ${parentMap['bird-species']}, NOW(), NOW()),
      ('ゼブラフィンチ', 'zebra-finch', 'ゼブラフィンチ', 4, true, ${parentMap['bird-species']}, NOW(), NOW()),
      ('文鳥', 'society-finch', '文鳥', 5, true, ${parentMap['bird-species']}, NOW(), NOW()),
      ('ゴシキキンカン', 'gouldian-finch', 'ゴシキキンカン', 6, true, ${parentMap['bird-species']}, NOW(), NOW()),
      ('カナリア', 'canary', 'カナリア', 7, true, ${parentMap['bird-species']}, NOW(), NOW()),
      ('マメルリハ', 'parrotlet', 'マメルリハ', 8, true, ${parentMap['bird-species']}, NOW(), NOW()),
      ('ジュウシマツ', 'munias', 'ジュウシマツ', 9, true, ${parentMap['bird-species']}, NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING;
    `)

    // Bird Care
    await payload.db.drizzle.execute(sql`
      INSERT INTO categories (title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
      ('ケージと飼育環境', 'housing-enclosures', 'ケージの選び方', 1, true, ${parentMap['bird-care']}, NOW(), NOW()),
      ('ケージサイズと設置', 'cage-setup', 'ケージのサイズ', 2, true, ${parentMap['bird-care']}, NOW(), NOW()),
      ('止まり木と設備', 'perches-accessories', '止まり木', 3, true, ${parentMap['bird-care']}, NOW(), NOW()),
      ('温度と湿度管理', 'temperature-humidity', '温度管理', 4, true, ${parentMap['bird-care']}, NOW(), NOW()),
      ('照明設備', 'lighting', '照明', 5, true, ${parentMap['bird-care']}, NOW(), NOW()),
      ('清掃と衛生管理', 'cleaning-hygiene', '清掃', 6, true, ${parentMap['bird-care']}, NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING;
    `)

    // Bird Health
    await payload.db.drizzle.execute(sql`
      INSERT INTO categories (title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
      ('日常の健康管理', 'daily-health-care', '健康チェック', 1, true, ${parentMap['bird-health']}, NOW(), NOW()),
      ('病気の症状と対処', 'illness-treatment', '病気の対処', 2, true, ${parentMap['bird-health']}, NOW(), NOW()),
      ('応急処置', 'emergency-care', '応急処置', 3, true, ${parentMap['bird-health']}, NOW(), NOW()),
      ('獣医師の診察', 'veterinary-care', '獣医師', 4, true, ${parentMap['bird-health']}, NOW(), NOW()),
      ('換羽期のケア', 'molting-care', '換羽期', 5, true, ${parentMap['bird-health']}, NOW(), NOW()),
      ('繁殖と産卵', 'breeding-care', '繁殖', 6, true, ${parentMap['bird-health']}, NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING;
    `)

    // Bird Behavior
    await payload.db.drizzle.execute(sql`
      INSERT INTO categories (title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
      ('鳴き声と意思疎通', 'vocalizations', '鳴き声', 1, true, ${parentMap['bird-behavior']}, NOW(), NOW()),
      ('行動パターン', 'behavior-patterns', '行動', 2, true, ${parentMap['bird-behavior']}, NOW(), NOW()),
      ('しつけと訓練', 'training', 'しつけ', 3, true, ${parentMap['bird-behavior']}, NOW(), NOW()),
      ('ストレス管理', 'stress-management', 'ストレス', 4, true, ${parentMap['bird-behavior']}, NOW(), NOW()),
      ('社会性と多頭飼い', 'social-behavior', '社会性', 5, true, ${parentMap['bird-behavior']}, NOW(), NOW()),
      ('遊びと運動', 'play-exercise', '遊び', 6, true, ${parentMap['bird-behavior']}, NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING;
    `)

    // Bird Watching
    await payload.db.drizzle.execute(sql`
      INSERT INTO categories (title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
      ('観察の基本', 'observation-basics', '観察基本', 1, true, ${parentMap['bird-watching']}, NOW(), NOW()),
      ('観察場所', 'observation-locations', '観察場所', 2, true, ${parentMap['bird-watching']}, NOW(), NOW()),
      ('観察用具', 'observation-equipment', '観察用具', 3, true, ${parentMap['bird-watching']}, NOW(), NOW()),
      ('季節別観察', 'seasonal-observation', '季節別', 4, true, ${parentMap['bird-watching']}, NOW(), NOW()),
      ('記録と写真', 'recording-photography', '記録', 5, true, ${parentMap['bird-watching']}, NOW(), NOW()),
      ('保護と環境', 'conservation', '保護', 6, true, ${parentMap['bird-watching']}, NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING;
    `)

    // Nutrition
    await payload.db.drizzle.execute(sql`
      INSERT INTO categories (title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
      ('基本的な餌', 'basic-diet', '基本的な餌', 1, true, ${parentMap['nutrition-feeding']}, NOW(), NOW()),
      ('新鮮な野菜と果物', 'fresh-foods', '野菜と果物', 2, true, ${parentMap['nutrition-feeding']}, NOW(), NOW()),
      ('タンパク質源', 'protein-sources', 'タンパク質', 3, true, ${parentMap['nutrition-feeding']}, NOW(), NOW()),
      ('サプリメント', 'supplements', 'サプリメント', 4, true, ${parentMap['nutrition-feeding']}, NOW(), NOW()),
      ('危険な食べ物', 'toxic-foods', '危険な食べ物', 5, true, ${parentMap['nutrition-feeding']}, NOW(), NOW()),
      ('給餌スケジュール', 'feeding-schedule', '給餌', 6, true, ${parentMap['nutrition-feeding']}, NOW(), NOW()),
      ('水分補給', 'hydration', '水分', 7, true, ${parentMap['nutrition-feeding']}, NOW(), NOW()),
      ('季節別の栄養', 'seasonal-nutrition', '季節別栄養', 8, true, ${parentMap['nutrition-feeding']}, NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING;
    `)

    // Get final count
    const finalCount = await payload.count({ collection: 'categories' })

    return NextResponse.json({
      success: true,
      message: `Categories inserted successfully via raw SQL`,
      totalCategories: finalCount.totalDocs,
      parentMap,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}