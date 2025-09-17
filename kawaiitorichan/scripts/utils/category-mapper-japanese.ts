import { Payload } from 'payload'

interface CategoryMapping {
  keywords: string[]
  parentSlug: string
  childSlugs?: string[]
}

// Define keyword mappings for automatic categorization with Japanese keywords
const categoryMappings: CategoryMapping[] = [
  // 基礎・入門 (Fundamentals)
  {
    keywords: ['初心者', 'ビギナー', 'beginner', 'first time', 'getting started', 'new to golf', 'absolute beginner', 'start playing', 'terminology', 'golf terms', '用語', '基礎', '基本', 'basics', 'fundamental', '入門'],
    parentSlug: 'fundamentals',
    childSlugs: ['getting-started', 'golf-basics', 'terminology-concepts'],
  },
  {
    keywords: ['グリップ', 'スタンス', '姿勢', 'grip', 'stance', 'posture', 'setup', 'address position', 'ball position', 'alignment', 'アライメント', 'セットアップ'],
    parentSlug: 'fundamentals',
    childSlugs: ['basic-techniques'],
  },

  // 用具・ギア (Equipment)
  {
    keywords: ['ドライバー', 'アイアン', 'ウェッジ', 'パター', 'ハイブリッド', 'ウッド', 'driver', 'iron', 'wedge', 'putter', 'hybrid', 'wood', 'club selection', 'club fitting', 'shaft', 'club head', 'クラブ選択', 'フィッティング', 'シャフト'],
    parentSlug: 'equipment',
    childSlugs: ['clubs'],
  },
  {
    keywords: ['ゴルフボール', 'ティー', 'グローブ', 'golf ball', 'golf tee', 'glove', 'golf bag', 'rangefinder', 'golf shoes', 'accessories', 'ゴルフバッグ', 'レンジファインダー', 'ゴルフシューズ', 'アクセサリー'],
    parentSlug: 'equipment',
    childSlugs: ['balls-accessories'],
  },
  {
    keywords: ['ベスト', 'レビュー', 'best golf', 'golf review', 'equipment review', 'product review', 'gear review', '製品レビュー', 'ギアレビュー'],
    parentSlug: 'equipment',
    childSlugs: ['gear-reviews'],
  },
  {
    keywords: ['購入ガイド', '選び方', 'buying guide', 'how to choose', 'equipment guide', 'maintenance', 'clean clubs', 'replace', 'メンテナンス', 'クラブクリーニング', '交換'],
    parentSlug: 'equipment',
    childSlugs: ['equipment-guides'],
  },
  {
    keywords: ['テクノロジー', 'イノベーション', 'technology', 'innovation', 'AI', 'launch monitor', 'trackman', 'simulator', 'トラックマン', 'シミュレーター'],
    parentSlug: 'equipment',
    childSlugs: ['technology-innovation'],
  },

  // スキル・技術 (Skills & Technique)
  {
    keywords: ['スイング', 'バックスイング', 'ダウンスイング', 'フォロースルー', 'swing', 'backswing', 'downswing', 'follow through', 'swing plane', 'swing path', 'swing speed', 'tempo', 'テンポ', 'スイングプレーン', 'スイングパス'],
    parentSlug: 'skills-technique',
    childSlugs: ['swing-mechanics'],
  },
  {
    keywords: ['チップ', 'ピッチ', 'バンカー', 'サンドショット', 'chip', 'pitch', 'bunker', 'sand shot', 'lob shot', 'flop shot', 'short game', 'ショートゲーム', 'ロブショット'],
    parentSlug: 'skills-technique',
    childSlugs: ['short-game'],
  },
  {
    keywords: ['パッティング', 'パット', 'putting', 'putt', 'green reading', 'putting stroke', 'putter', 'グリーンリーディング', 'パッティングストローク'],
    parentSlug: 'skills-technique',
    childSlugs: ['putting'],
  },
  {
    keywords: ['練習', 'ドリル', 'エクササイズ', 'practice', 'drill', 'exercise', 'training', 'routine', 'improve', 'workout', 'トレーニング', 'ルーティン', '改善'],
    parentSlug: 'skills-technique',
    childSlugs: ['practice-drills'],
  },
  {
    keywords: ['スライス', 'フック', 'シャンク', 'トップ', 'slice', 'hook', 'shank', 'top', 'fat shot', 'thin shot', 'fix', 'problem', 'mistake', 'error', '修正', '問題', 'ミス'],
    parentSlug: 'skills-technique',
    childSlugs: ['problem-solving'],
  },
  {
    keywords: ['上級', 'ドロー', 'フェード', 'advanced', 'draw', 'fade', 'shape shot', 'trajectory', 'spin', 'expert', 'スピン', '軌道'],
    parentSlug: 'skills-technique',
    childSlugs: ['advanced-techniques'],
  },

  // プレー・戦略 (Playing Golf)
  {
    keywords: ['コース管理', '戦略', '戦術', 'course management', 'strategy', 'tactics', 'decision making', 'course navigation', 'hazard', 'ハザード', '意思決定'],
    parentSlug: 'playing-golf',
    childSlugs: ['course-management', 'strategy-tactics'],
  },
  {
    keywords: ['メンタル', '自信', '緊張', 'mental game', 'confidence', 'nerves', 'pressure', 'focus', 'concentration', 'psychology', '心理学', '集中力', 'プレッシャー'],
    parentSlug: 'playing-golf',
    childSlugs: ['mental-game'],
  },
  {
    keywords: ['スコア', 'スコアリング', 'ハンディキャップ', 'score', 'scoring', 'handicap', 'breaking 100', 'breaking 90', 'breaking 80', 'improvement', '100切り', '90切り', '80切り'],
    parentSlug: 'playing-golf',
    childSlugs: ['scoring-improvement'],
  },
  {
    keywords: ['風', '雨', '天候', 'wind', 'rain', 'weather', 'cold', 'hot', 'conditions', 'links', 'parkland', 'リンクス', 'パークランド', 'コンディション'],
    parentSlug: 'playing-golf',
    childSlugs: ['weather-conditions'],
  },
  {
    keywords: ['ストロークプレー', 'マッチプレー', 'スクランブル', 'stroke play', 'match play', 'scramble', 'best ball', 'foursome', 'format', 'tournament', 'トーナメント', '競技'],
    parentSlug: 'playing-golf',
    childSlugs: ['different-formats'],
  },

  // ゴルフライフ (Golf Life)
  {
    keywords: ['ルール', 'ペナルティ', 'rule', 'penalty', 'USGA', 'R&A', 'out of bounds', 'water hazard', 'relief', 'drop', 'OB', 'ウォーターハザード', 'ドロップ'],
    parentSlug: 'golf-life',
    childSlugs: ['rules-regulations'],
  },
  {
    keywords: ['エチケット', 'マナー', 'etiquette', 'pace of play', 'dress code', 'behavior', 'manners', 'culture', 'tradition', 'ドレスコード', '文化', '伝統'],
    parentSlug: 'golf-life',
    childSlugs: ['etiquette-culture'],
  },
  {
    keywords: ['ライフスタイル', 'メンバーシップ', 'lifestyle', 'golf life', 'membership', 'country club', 'private club', 'public course', 'カントリークラブ', 'プライベートクラブ', 'パブリックコース'],
    parentSlug: 'golf-life',
    childSlugs: ['golf-lifestyle'],
  },
  {
    keywords: ['競技', 'トーナメント', 'イベント', 'competition', 'tournament', 'event', 'championship', 'tour', 'professional', 'チャンピオンシップ', 'ツアー', 'プロフェッショナル'],
    parentSlug: 'golf-life',
    childSlugs: ['competitions-events'],
  },
  {
    keywords: ['ビジネス', '業界', 'business', 'industry', 'golf market', 'golf economy', 'golf brand', 'ゴルフ市場', 'ゴルフ経済', 'ブランド'],
    parentSlug: 'golf-life',
    childSlugs: ['golf-business'],
  },
  {
    keywords: ['歴史', '伝統', 'history', 'tradition', 'heritage', 'classic', 'legendary', 'historic', 'ヘリテージ', 'クラシック', '伝説的'],
    parentSlug: 'golf-life',
    childSlugs: ['history-traditions'],
  },
]

export class CategoryMapperJapanese {
  private payload: Payload
  private categoryCache: Map<string, any> = new Map()

  constructor(payload: Payload) {
    this.payload = payload
  }

  async initialize() {
    // Load all categories into cache
    const { docs: categories } = await this.payload.find({
      collection: 'categories',
      limit: 200,
    })

    categories.forEach(cat => {
      this.categoryCache.set(cat.slug, cat)
    })
  }

  /**
   * Analyze content and suggest appropriate categories
   */
  async suggestCategories(
    title: string,
    content?: string,
    existingCategories?: string[]
  ): Promise<string[]> {
    const text = `${title} ${content || ''}`.toLowerCase()
    const suggestedCategoryIds = new Set<string>()

    // Check each mapping
    for (const mapping of categoryMappings) {
      const hasKeyword = mapping.keywords.some(keyword => 
        text.includes(keyword.toLowerCase())
      )

      if (hasKeyword) {
        // Add parent category
        const parentCat = this.categoryCache.get(mapping.parentSlug)
        if (parentCat) {
          suggestedCategoryIds.add(parentCat.id)
        }

        // Add most relevant child category
        if (mapping.childSlugs && mapping.childSlugs.length > 0) {
          // Score each child category based on keyword matches
          let bestChild = null
          let bestScore = 0

          for (const childSlug of mapping.childSlugs) {
            const childCat = this.categoryCache.get(childSlug)
            if (childCat) {
              // Count keyword matches for this specific child
              const score = mapping.keywords.filter(kw => 
                text.includes(kw.toLowerCase())
              ).length

              if (score > bestScore) {
                bestScore = score
                bestChild = childCat
              }
            }
          }

          if (bestChild) {
            suggestedCategoryIds.add(bestChild.id)
          }
        }
      }
    }

    // If no categories found, suggest based on general content
    if (suggestedCategoryIds.size === 0) {
      // Default to fundamentals for beginner content
      const fundamentals = this.categoryCache.get('fundamentals')
      if (fundamentals) {
        suggestedCategoryIds.add(fundamentals.id)
      }
    }

    return Array.from(suggestedCategoryIds)
  }

  /**
   * Map WordPress categories to new Japanese structure
   */
  mapWordPressCategory(wpCategory: string): string[] {
    const categoryMap: Record<string, string[]> = {
      // WordPress category -> [parent-slug, child-slug]
      'Golf Fundamentals & Getting Started': ['fundamentals', 'getting-started'],
      'Complete Beginner Guides': ['fundamentals', 'getting-started'],
      'Basic Skills Development': ['fundamentals', 'basic-techniques'],
      'Getting Started Essentials': ['fundamentals', 'getting-started'],
      'Practice Routines': ['skills-technique', 'practice-drills'],
      
      'Equipment & Gear': ['equipment'],
      'Club Selection & Reviews': ['equipment', 'clubs'],
      'Golf Balls & Accessories': ['equipment', 'balls-accessories'],
      'Beginner Equipment Guides': ['equipment', 'equipment-guides'],
      'Equipment Maintenance': ['equipment', 'equipment-guides'],
      
      'Swing Technique & Instruction': ['skills-technique'],
      'Swing Fundamentals': ['skills-technique', 'swing-mechanics'],
      'Common Problems & Fixes': ['skills-technique', 'problem-solving'],
      'Advanced Techniques': ['skills-technique', 'advanced-techniques'],
      'Practice Drills': ['skills-technique', 'practice-drills'],
      
      'Course Management & Strategy': ['playing-golf', 'course-management'],
      'Playing Your First Round': ['playing-golf', 'course-management'],
      'Scoring & Improvement': ['playing-golf', 'scoring-improvement'],
      'Mental Game': ['playing-golf', 'mental-game'],
      'Different Course Conditions': ['playing-golf', 'weather-conditions'],
      
      'Rules, Etiquette & Culture': ['golf-life'],
      'Essential Rules': ['golf-life', 'rules-regulations'],
      'Golf Etiquette': ['golf-life', 'etiquette-culture'],
      'Golf Culture & Lifestyle': ['golf-life', 'golf-lifestyle'],
      'Tournament & Competition': ['golf-life', 'competitions-events'],
      
      'Technology': ['equipment', 'technology-innovation'],
      'AI & Machine Learning': ['equipment', 'technology-innovation'],
    }

    const mapping = categoryMap[wpCategory]
    if (!mapping) {
      return []
    }

    const categoryIds: string[] = []
    for (const slug of mapping) {
      const category = this.categoryCache.get(slug)
      if (category) {
        categoryIds.push(category.id)
      }
    }

    return categoryIds
  }

  /**
   * Get category by slug
   */
  getCategoryBySlug(slug: string) {
    return this.categoryCache.get(slug)
  }

  /**
   * Get all categories in hierarchical structure
   */
  getHierarchicalCategories() {
    const categories = Array.from(this.categoryCache.values())
    const parents = categories.filter(c => !c.parent)
    
    return parents.map(parent => ({
      ...parent,
      children: categories.filter(c => 
        typeof c.parent === 'object' ? c.parent.id === parent.id : c.parent === parent.id
      ),
    }))
  }
}

// Utility function for use in import scripts
export async function createCategoryMapperJapanese(payload: Payload) {
  const mapper = new CategoryMapperJapanese(payload)
  await mapper.initialize()
  return mapper
}