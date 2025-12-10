/**
 * Entity Linking Utility for Bird Species
 * Implements surface form dictionary and automatic entity linking
 * Based on Entity-Oriented Search principles (Chapter 5: Entity Linking)
 */

export interface EntityDefinition {
  canonicalName: string
  slug: string
  surfaceForms: string[]
  priority: number // Higher = more important, link first
}

/**
 * Surface Form Dictionary for Bird Species
 * Maps various surface forms (alternate names, nicknames, misspellings) to canonical entities
 */
export const birdEntityDictionary: EntityDefinition[] = [
  {
    canonicalName: 'セキセイインコ',
    slug: 'budgerigar',
    surfaceForms: [
      'セキセイインコ',
      'せきせいいんこ',
      'インコ',
      'いんこ',
      'バジー',
      'Budgerigar',
      'budgerigar',
      'Budgie',
      'budgie',
      '背黄青鸚哥',
    ],
    priority: 10,
  },
  {
    canonicalName: 'オカメインコ',
    slug: 'cockatiel',
    surfaceForms: [
      'オカメインコ',
      'おかめいんこ',
      'オカメ',
      'おかめ',
      'Cockatiel',
      'cockatiel',
      'カクテル',
      '阿亀鸚哥',
    ],
    priority: 10,
  },
  {
    canonicalName: '文鳥',
    slug: 'java-sparrow',
    surfaceForms: [
      '文鳥',
      'ぶんちょう',
      'ブンチョウ',
      'Java Sparrow',
      'java sparrow',
      'Java sparrow',
      '手乗り文鳥',
      '白文鳥',
      '桜文鳥',
    ],
    priority: 10,
  },
  {
    canonicalName: 'カナリア',
    slug: 'canary',
    surfaceForms: [
      'カナリア',
      'かなりあ',
      'カナリヤ',
      'Canary',
      'canary',
      'カナリアシード', // Will be handled carefully
    ],
    priority: 9,
  },
  {
    canonicalName: 'コザクラインコ',
    slug: 'lovebird',
    surfaceForms: [
      'コザクラインコ',
      'こざくらいんこ',
      'ラブバード',
      'Lovebird',
      'lovebird',
      'Love Bird',
      'ボタンインコ',
      'ぼたんいんこ',
    ],
    priority: 10,
  },
  {
    canonicalName: 'フィンチ',
    slug: 'finch',
    surfaceForms: [
      'フィンチ',
      'ふぃんち',
      'Finch',
      'finch',
      '十姉妹',
      'ジュウシマツ',
      'じゅうしまつ',
      'キンカチョウ',
      'きんかちょう',
      '錦花鳥',
    ],
    priority: 9,
  },
]

/**
 * Build a regex pattern from surface forms
 * Sorts by length (longest first) to avoid partial matches
 */
function buildEntityPattern(entities: EntityDefinition[]): RegExp {
  const allForms = entities
    .flatMap(entity => entity.surfaceForms)
    .sort((a, b) => b.length - a.length) // Longest first to avoid partial matches
    .map(form => escapeRegExp(form))

  return new RegExp(`(${allForms.join('|')})`, 'gi')
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Find entity by surface form
 */
function findEntityBySurfaceForm(surfaceForm: string): EntityDefinition | null {
  const lowerForm = surfaceForm.toLowerCase()
  for (const entity of birdEntityDictionary) {
    if (entity.surfaceForms.some(form => form.toLowerCase() === lowerForm)) {
      return entity
    }
  }
  return null
}

export interface EntityMatch {
  entity: EntityDefinition
  surfaceForm: string
  index: number
  length: number
}

/**
 * Find all entity mentions in text
 * Returns matches with their positions
 */
export function findEntityMentions(text: string): EntityMatch[] {
  const pattern = buildEntityPattern(birdEntityDictionary)
  const matches: EntityMatch[] = []
  let match

  while ((match = pattern.exec(text)) !== null) {
    const surfaceForm = match[1]
    const entity = findEntityBySurfaceForm(surfaceForm)

    if (entity) {
      matches.push({
        entity,
        surfaceForm,
        index: match.index,
        length: surfaceForm.length,
      })
    }
  }

  return matches
}

/**
 * Options for entity linking
 */
export interface EntityLinkingOptions {
  linkFirstMentionOnly?: boolean // Only link first mention of each entity
  excludePatterns?: RegExp[] // Patterns to exclude from linking (e.g., already linked text)
  maxLinksPerEntity?: number // Maximum links per entity type
  currentPageSlug?: string // Don't link to current page
}

/**
 * Apply entity links to plain text
 * Returns text with markdown-style links
 */
export function applyEntityLinks(
  text: string,
  options: EntityLinkingOptions = {}
): string {
  const {
    linkFirstMentionOnly = true,
    excludePatterns = [],
    maxLinksPerEntity = 1,
    currentPageSlug,
  } = options

  // Track which entities have been linked
  const linkedEntities = new Map<string, number>()

  // Find all matches
  const matches = findEntityMentions(text)

  // Sort by priority and index
  matches.sort((a, b) => {
    if (a.entity.priority !== b.entity.priority) {
      return b.entity.priority - a.entity.priority
    }
    return a.index - b.index
  })

  // Track linked regions to avoid overlapping links
  const linkedRegions: Array<{ start: number; end: number }> = []

  // Build result by replacing matches
  let result = text
  let offset = 0

  for (const match of matches) {
    const entitySlug = match.entity.slug

    // Skip if this is the current page
    if (currentPageSlug && entitySlug === currentPageSlug) {
      continue
    }

    // Check link count for this entity
    const currentCount = linkedEntities.get(entitySlug) || 0
    if (currentCount >= maxLinksPerEntity) {
      continue
    }

    // Check if this region overlaps with already linked region
    const adjustedIndex = match.index + offset
    const isOverlapping = linkedRegions.some(
      region =>
        (adjustedIndex >= region.start && adjustedIndex < region.end) ||
        (adjustedIndex + match.length > region.start && adjustedIndex + match.length <= region.end)
    )

    if (isOverlapping) {
      continue
    }

    // Check exclusion patterns
    const contextStart = Math.max(0, adjustedIndex - 50)
    const contextEnd = Math.min(result.length, adjustedIndex + match.length + 50)
    const context = result.slice(contextStart, contextEnd)

    const isExcluded = excludePatterns.some(pattern => pattern.test(context))
    if (isExcluded) {
      continue
    }

    // Create the link
    const linkText = `[${match.surfaceForm}](/birds/${entitySlug})`
    const originalLength = match.length
    const newLength = linkText.length

    // Replace in result
    result =
      result.slice(0, adjustedIndex) +
      linkText +
      result.slice(adjustedIndex + originalLength)

    // Update offset for subsequent matches
    offset += newLength - originalLength

    // Track linked region
    linkedRegions.push({
      start: adjustedIndex,
      end: adjustedIndex + newLength,
    })

    // Update entity link count
    linkedEntities.set(entitySlug, currentCount + 1)
  }

  return result
}

/**
 * Entity linking for Lexical rich text content
 * Modifies Lexical nodes to add internal links
 */
export function applyEntityLinksToLexical(
  content: any,
  options: EntityLinkingOptions = {}
): any {
  if (!content || !content.root || !content.root.children) {
    return content
  }

  const {
    linkFirstMentionOnly = true,
    maxLinksPerEntity = 1,
    currentPageSlug,
  } = options

  // Track which entities have been linked
  const linkedEntities = new Map<string, number>()

  // Deep clone content to avoid mutations
  const result = JSON.parse(JSON.stringify(content))

  // Process text nodes recursively
  function processNode(node: any): any {
    // Skip if already a link
    if (node.type === 'link' || node.type === 'autolink') {
      return node
    }

    // Process text nodes
    if (node.type === 'text' && node.text) {
      const text = node.text
      const matches = findEntityMentions(text)

      if (matches.length === 0) {
        return node
      }

      // Filter matches based on options
      const validMatches = matches.filter(match => {
        const entitySlug = match.entity.slug

        // Skip if this is the current page
        if (currentPageSlug && entitySlug === currentPageSlug) {
          return false
        }

        // Check link count for this entity
        const currentCount = linkedEntities.get(entitySlug) || 0
        if (currentCount >= maxLinksPerEntity) {
          return false
        }

        return true
      })

      if (validMatches.length === 0) {
        return node
      }

      // Take only the first match (for simplicity)
      const match = validMatches[0]
      const entitySlug = match.entity.slug

      // Update link count
      const currentCount = linkedEntities.get(entitySlug) || 0
      linkedEntities.set(entitySlug, currentCount + 1)

      // Split text node into parts
      const before = text.slice(0, match.index)
      const linkText = match.surfaceForm
      const after = text.slice(match.index + match.length)

      // Create new nodes
      const newNodes: any[] = []

      if (before) {
        newNodes.push({ ...node, text: before })
      }

      // Create internal link node
      newNodes.push({
        type: 'link',
        version: 1,
        fields: {
          linkType: 'internal',
          doc: null,
          url: `/birds/${entitySlug}`,
          newTab: false,
        },
        children: [
          {
            type: 'text',
            text: linkText,
            format: node.format || 0,
            detail: 0,
            mode: 'normal',
            style: '',
            version: 1,
          },
        ],
      })

      if (after) {
        // Recursively process remaining text
        const afterNode = { ...node, text: after }
        const processedAfter = processNode(afterNode)
        if (Array.isArray(processedAfter)) {
          newNodes.push(...processedAfter)
        } else {
          newNodes.push(processedAfter)
        }
      }

      return newNodes
    }

    // Process children
    if (node.children && Array.isArray(node.children)) {
      const newChildren: any[] = []
      for (const child of node.children) {
        const processed = processNode(child)
        if (Array.isArray(processed)) {
          newChildren.push(...processed)
        } else {
          newChildren.push(processed)
        }
      }
      node.children = newChildren
    }

    return node
  }

  // Process all root children
  result.root.children = result.root.children.map((child: any) => {
    const processed = processNode(child)
    return Array.isArray(processed) ? processed[0] : processed
  })

  return result
}

/**
 * Get all entities that should be linked from a text
 * Used for building "Related Entities" sections
 */
export function extractMentionedEntities(text: string): EntityDefinition[] {
  const matches = findEntityMentions(text)
  const seen = new Set<string>()
  const entities: EntityDefinition[] = []

  for (const match of matches) {
    if (!seen.has(match.entity.slug)) {
      seen.add(match.entity.slug)
      entities.push(match.entity)
    }
  }

  return entities.sort((a, b) => b.priority - a.priority)
}

/**
 * Check if text contains any bird entity mentions
 */
export function containsBirdEntity(text: string): boolean {
  const pattern = buildEntityPattern(birdEntityDictionary)
  return pattern.test(text)
}

/**
 * Get the canonical entity for a surface form
 */
export function getCanonicalEntity(surfaceForm: string): EntityDefinition | null {
  return findEntityBySurfaceForm(surfaceForm)
}
