export interface Category {
  id: string | number
  title: string
  slug: string
}

export interface CategoryMatchResult {
  matched: Category[]
  unmatched: string[]
}

/**
 * Keywords for each category
 * Maps category slug to array of keywords (both Japanese and English)
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'wild-birds': [
    '野鳥',
    '観察',
    'バードウォッチング',
    '探鳥',
    'watching',
    'observation',
    'wild',
    '野生',
    '自然',
  ],
  'bird-health': [
    '健康',
    '病気',
    '治療',
    'ケア',
    '獣医',
    'health',
    'disease',
    'vet',
    '医療',
    '症状',
    'sick',
    'ill',
  ],
  'bird-ecology': [
    '生態',
    '行動',
    '習性',
    '生息',
    '環境',
    'ecology',
    'behavior',
    'habitat',
    '特徴',
    '性質',
    'nature',
  ],
  'bird-species': [
    '種類',
    '品種',
    'スズメ',
    'カラス',
    'インコ',
    'species',
    'types',
    'breeds',
    '鳥類',
    '分類',
    'classification',
    'sparrow',
    'crow',
    'parrot',
  ],
  'bird-care': [
    '飼い方',
    '飼育',
    'エサ',
    '餌',
    'ケージ',
    'care',
    'feeding',
    'cage',
    '世話',
    '育て方',
    'raising',
    'keeping',
  ],
}

/**
 * Match categories based on title keywords
 * @param title - The post title to match against
 * @param categories - All available categories
 * @returns Object with matched categories and unmatched category slugs
 */
export function matchCategories(title: string, categories: Category[]): CategoryMatchResult {
  const titleLower = title.toLowerCase()
  const matched: Category[] = []
  const unmatched: string[] = []

  // Check each category
  for (const category of categories) {
    const keywords = CATEGORY_KEYWORDS[category.slug] || []
    let hasMatch = false

    // Check if any keyword is in the title
    for (const keyword of keywords) {
      if (titleLower.includes(keyword.toLowerCase())) {
        hasMatch = true
        break
      }
    }

    if (hasMatch) {
      matched.push(category)
    }
  }

  // Track which category slugs had no matches
  if (matched.length === 0) {
    unmatched.push(...Object.keys(CATEGORY_KEYWORDS))
  }

  return {
    matched,
    unmatched: matched.length === 0 ? ['No matching categories found'] : [],
  }
}

/**
 * Get category by slug
 */
export function getCategoryBySlug(slug: string, categories: Category[]): Category | null {
  return categories.find(cat => cat.slug === slug) || null
}

/**
 * Get category by ID
 */
export function getCategoryById(
  id: string | number,
  categories: Category[],
): Category | null {
  return categories.find(cat => cat.id === id) || null
}

/**
 * Add keywords to category mapping (for dynamic configuration)
 */
export function addCategoryKeywords(categorySlug: string, keywords: string[]): void {
  if (!CATEGORY_KEYWORDS[categorySlug]) {
    CATEGORY_KEYWORDS[categorySlug] = []
  }
  CATEGORY_KEYWORDS[categorySlug].push(...keywords)
}

/**
 * Get all keywords for a category
 */
export function getCategoryKeywords(categorySlug: string): string[] {
  return CATEGORY_KEYWORDS[categorySlug] || []
}
