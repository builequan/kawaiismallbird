import { Payload } from 'payload'

interface CategoryMapping {
  keywords: string[]
  parentSlug: string
  childSlugs?: string[]
}

// Define keyword mappings for automatic categorization
const categoryMappings: CategoryMapping[] = [
  // Fundamentals
  {
    keywords: ['beginner', 'first time', 'getting started', 'new to golf', 'absolute beginner', 'start playing', 'terminology', 'golf terms', 'basics', 'fundamental'],
    parentSlug: 'fundamentals',
    childSlugs: ['getting-started', 'golf-basics', 'terminology-concepts'],
  },
  {
    keywords: ['grip', 'stance', 'posture', 'setup', 'address position', 'ball position', 'alignment'],
    parentSlug: 'fundamentals',
    childSlugs: ['basic-techniques'],
  },

  // Equipment
  {
    keywords: ['driver', 'iron', 'wedge', 'putter', 'hybrid', 'wood', 'club selection', 'club fitting', 'shaft', 'club head'],
    parentSlug: 'equipment',
    childSlugs: ['clubs'],
  },
  {
    keywords: ['golf ball', 'golf tee', 'glove', 'golf bag', 'rangefinder', 'golf shoes', 'accessories'],
    parentSlug: 'equipment',
    childSlugs: ['balls-accessories'],
  },
  {
    keywords: ['best golf', 'golf review', 'equipment review', 'product review', 'gear review'],
    parentSlug: 'equipment',
    childSlugs: ['gear-reviews'],
  },
  {
    keywords: ['buying guide', 'how to choose', 'equipment guide', 'maintenance', 'clean clubs', 'replace'],
    parentSlug: 'equipment',
    childSlugs: ['equipment-guides'],
  },
  {
    keywords: ['technology', 'innovation', 'AI', 'launch monitor', 'trackman', 'simulator'],
    parentSlug: 'equipment',
    childSlugs: ['technology-innovation'],
  },

  // Skills & Technique
  {
    keywords: ['swing', 'backswing', 'downswing', 'follow through', 'swing plane', 'swing path', 'swing speed', 'tempo'],
    parentSlug: 'skills-technique',
    childSlugs: ['swing-mechanics'],
  },
  {
    keywords: ['chip', 'pitch', 'bunker', 'sand shot', 'lob shot', 'flop shot', 'short game'],
    parentSlug: 'skills-technique',
    childSlugs: ['short-game'],
  },
  {
    keywords: ['putting', 'putt', 'green reading', 'putting stroke', 'putter'],
    parentSlug: 'skills-technique',
    childSlugs: ['putting'],
  },
  {
    keywords: ['practice', 'drill', 'exercise', 'training', 'routine', 'improve', 'workout'],
    parentSlug: 'skills-technique',
    childSlugs: ['practice-drills'],
  },
  {
    keywords: ['slice', 'hook', 'shank', 'top', 'fat shot', 'thin shot', 'fix', 'problem', 'mistake', 'error'],
    parentSlug: 'skills-technique',
    childSlugs: ['problem-solving'],
  },
  {
    keywords: ['advanced', 'draw', 'fade', 'shape shot', 'trajectory', 'spin', 'expert'],
    parentSlug: 'skills-technique',
    childSlugs: ['advanced-techniques'],
  },

  // Playing Golf
  {
    keywords: ['course management', 'strategy', 'tactics', 'decision making', 'course navigation', 'hazard'],
    parentSlug: 'playing-golf',
    childSlugs: ['course-management', 'strategy-tactics'],
  },
  {
    keywords: ['mental game', 'confidence', 'nerves', 'pressure', 'focus', 'concentration', 'psychology'],
    parentSlug: 'playing-golf',
    childSlugs: ['mental-game'],
  },
  {
    keywords: ['score', 'scoring', 'handicap', 'breaking 100', 'breaking 90', 'breaking 80', 'improvement'],
    parentSlug: 'playing-golf',
    childSlugs: ['scoring-improvement'],
  },
  {
    keywords: ['wind', 'rain', 'weather', 'cold', 'hot', 'conditions', 'links', 'parkland'],
    parentSlug: 'playing-golf',
    childSlugs: ['weather-conditions'],
  },
  {
    keywords: ['stroke play', 'match play', 'scramble', 'best ball', 'foursome', 'format', 'tournament'],
    parentSlug: 'playing-golf',
    childSlugs: ['different-formats'],
  },

  // Golf Life
  {
    keywords: ['rule', 'penalty', 'USGA', 'R&A', 'out of bounds', 'water hazard', 'relief', 'drop'],
    parentSlug: 'golf-life',
    childSlugs: ['rules-regulations'],
  },
  {
    keywords: ['etiquette', 'pace of play', 'dress code', 'behavior', 'manners', 'culture', 'tradition'],
    parentSlug: 'golf-life',
    childSlugs: ['etiquette-culture'],
  },
  {
    keywords: ['lifestyle', 'golf life', 'membership', 'country club', 'private club', 'public course'],
    parentSlug: 'golf-life',
    childSlugs: ['golf-lifestyle'],
  },
  {
    keywords: ['competition', 'tournament', 'event', 'championship', 'tour', 'professional'],
    parentSlug: 'golf-life',
    childSlugs: ['competitions-events'],
  },
  {
    keywords: ['business', 'industry', 'golf market', 'golf economy', 'golf brand'],
    parentSlug: 'golf-life',
    childSlugs: ['golf-business'],
  },
  {
    keywords: ['history', 'tradition', 'heritage', 'classic', 'legendary', 'historic'],
    parentSlug: 'golf-life',
    childSlugs: ['history-traditions'],
  },
]

export class CategoryMapper {
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
   * Map WordPress categories to new structure
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
export async function createCategoryMapper(payload: Payload) {
  const mapper = new CategoryMapper(payload)
  await mapper.initialize()
  return mapper
}