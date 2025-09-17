import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { convertMarkdownToLexical, extractExcerpt } from './markdown-to-lexical'
import { uploadImageToPayload, processContentImages } from './image-upload'

interface ImportOptions {
  folderPath: string
  imagesFolder: string
  dryRun?: boolean
  overwrite?: boolean
  removeDuplicates?: boolean
}

interface ImportResult {
  success: boolean
  imported: number
  failed: number
  errors: Array<{
    file: string
    error: string
  }>
  details: Array<{
    file: string
    title: string
    slug: string
    status: 'created' | 'updated' | 'skipped' | 'failed'
  }>
}

export async function importWordPressContent(options: ImportOptions): Promise<ImportResult> {
  const { folderPath, imagesFolder, dryRun = false, overwrite = false, removeDuplicates = true } = options
  
  const payload = await getPayload({ config: configPromise })
  
  const result: ImportResult = {
    success: true,
    imported: 0,
    failed: 0,
    errors: [],
    details: [],
  }
  
  try {
    // Check if the folder exists
    if (!fs.existsSync(folderPath)) {
      throw new Error(`Directory does not exist: ${folderPath}`)
    }
    
    // Get all markdown files in the folder
    const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.md'))
    
    for (const file of files) {
      const filePath = path.join(folderPath, file)
      
      try {
        // Read file content
        const content = fs.readFileSync(filePath, 'utf-8')
        
        // Convert markdown to Lexical format
        const converted = await convertMarkdownToLexical(content, removeDuplicates)
        const { metadata, lexicalContent, images, mermaidDiagrams, codeBlocks } = converted
        
        // Check if post already exists
        const existingPost = await payload.find({
          collection: 'posts',
          where: {
            slug: {
              equals: metadata.slug || file.replace('.md', ''),
            },
          },
        })
        
        if (existingPost.docs.length > 0 && !overwrite) {
          result.details.push({
            file,
            title: metadata.title || '',
            slug: metadata.slug || '',
            status: 'skipped',
          })
          continue
        }
        
        // Process categories
        const categoryIds = await processCategories(payload, metadata.categories || [])
        
        // Process tags
        const tagIds = await processTags(payload, metadata.tags || [])
        
        // Process featured image with fallback logic
        let heroImageId = null
        if (metadata.featured_image) {
          try {
            heroImageId = await uploadImageToPayload({
              imagePath: metadata.featured_image,
              imagesFolder,
              altText: metadata.featured_image_alt || metadata.title,
              payload,
            })
          } catch (imgError) {
            console.warn(`Failed to process featured image for ${file}:`, imgError)
          }
        }
        
        // If no featured image was uploaded, try to find a fallback image
        if (!heroImageId) {
          const fallbackImages = [
            'golf-bag-essentials-hero.webp',
            'golf-accessories-hero.webp', 
            'beginner-golf-balls-hero.webp',
            'fun-games-hero.webp',
            'first-round-hero.webp'
          ]
          
          for (const fallbackImage of fallbackImages) {
            try {
              const fallbackPath = path.join(imagesFolder, fallbackImage)
              if (fs.existsSync(fallbackPath)) {
                heroImageId = await uploadImageToPayload({
                  imagePath: fallbackImage,
                  imagesFolder,
                  altText: metadata.title || 'Golf article featured image',
                  payload,
                })
                if (heroImageId) {
                  console.log(`Using fallback image: ${fallbackImage} for ${file}`)
                  break
                }
              }
            } catch (fallbackError) {
              console.warn(`Failed to upload fallback image ${fallbackImage}:`, fallbackError)
            }
          }
        }
        
        // Process images in content
        const processedContent = await processContentImages(
          lexicalContent,
          images,
          imagesFolder,
          payload
        )
        
        // Mermaid diagrams are now handled as code blocks in the lexical converter
        // No additional processing needed
        const contentWithMermaid = processedContent
        
        // Prepare post data
        const postData = {
          title: metadata.title || file.replace('.md', ''),
          slug: metadata.slug || file.replace('.md', ''),
          content: contentWithMermaid,
          excerpt: metadata.excerpt ? {
            root: {
              children: [
                {
                  children: [
                    {
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                      text: metadata.excerpt,
                      type: 'text',
                      version: 1,
                    },
                  ],
                  direction: 'ltr' as const,
                  format: '' as const,
                  indent: 0,
                  type: 'paragraph',
                  version: 1,
                },
              ],
              direction: 'ltr' as const,
              format: '' as const,
              indent: 0,
              type: 'root',
              version: 1,
            },
          } : null,
          language: detectLanguage(filePath),
          heroImage: heroImageId ? parseInt(heroImageId) : null,
          heroImageAlt: metadata.featured_image_alt,
          categories: categoryIds.map(id => parseInt(id)),
          tags: tagIds.map(id => parseInt(id)),
          meta: {
            title: metadata.title || metadata.slug?.replace(/-/g, ' ') || file.replace('.md', '').replace(/-/g, ' '),
            description: metadata.meta_description || metadata.excerpt || extractExcerpt(content),
            keywords: metadata.meta_keywords,
            focusKeyphrase: metadata.focus_keyphrase,
          },
          wordpressMetadata: {
            originalAuthor: metadata.author,
            originalDate: metadata.date ? new Date(metadata.date).toISOString() : undefined,
            modifiedDate: metadata.modified ? new Date(metadata.modified).toISOString() : undefined,
            status: (metadata.status === 'published' ? 'published' : 'draft') as 'draft' | 'published',
            enableComments: metadata.enable_comments !== false,
            enableToc: metadata.enable_toc !== false,
          },
          publishedAt: metadata.date ? new Date(metadata.date).toISOString() : new Date().toISOString(),
          _status: (metadata.status === 'draft' ? 'draft' : 'published') as 'draft' | 'published',
        }
        
        if (!dryRun) {
          // Create or update the post
          if (existingPost.docs.length > 0) {
            await payload.update({
              collection: 'posts',
              id: existingPost.docs[0].id,
              data: postData,
            })
            
            result.details.push({
              file,
              title: metadata.title || '',
              slug: metadata.slug || '',
              status: 'updated',
            })
          } else {
            await payload.create({
              collection: 'posts',
              data: postData,
            })
            
            result.details.push({
              file,
              title: metadata.title || '',
              slug: metadata.slug || '',
              status: 'created',
            })
          }
          
          result.imported++
        } else {
          // Dry run - just add to details
          result.details.push({
            file,
            title: metadata.title || '',
            slug: metadata.slug || '',
            status: existingPost.docs.length > 0 ? 'updated' : 'created',
          })
          result.imported++
        }
        
      } catch (error) {
        result.failed++
        result.errors.push({
          file,
          error: error instanceof Error ? error.message : String(error),
        })
        result.details.push({
          file,
          title: '',
          slug: '',
          status: 'failed',
        })
      }
    }
    
  } catch (error) {
    result.success = false
    result.errors.push({
      file: 'general',
      error: error instanceof Error ? error.message : String(error),
    })
  }
  
  return result
}

async function processCategories(payload: any, categories: string[]): Promise<string[]> {
  const categoryIds: string[] = []
  const addedCategoryIds = new Set<string>()
  
  // Translation map for Japanese categories
  const categoryTranslations: Record<string, string> = {
    'ゴルフ指導': 'Golf Instruction',
    'ゴルフ技術': 'Golf Technique',
    'ゴルフバックスイング': 'Golf Backswing',
    'ゴルフスイング技術': 'Golf Swing Technique',
    'ゴルフバックスイングミス': 'Golf Backswing Mistakes',
    'ゴルフ基礎': 'Golf Basics',
    'ゴルフ初心者': 'Golf Beginners',
    'ゴルフエチケット': 'Golf Etiquette',
    'ゴルフルール': 'Golf Rules',
    'ゴルフ練習': 'Golf Practice',
    'ゴルフトレーニング': 'Golf Training',
    'ゴルフ用品': 'Golf Equipment',
    'ゴルフクラブ': 'Golf Clubs',
    'ゴルフボール': 'Golf Balls',
    'ゴルフコース': 'Golf Course',
    'ゴルフスコア': 'Golf Score',
    'ゴルフメンタル': 'Golf Mental Game',
    'ゴルフテンポ': 'Golf Tempo',
    'ゴルフグリップ': 'Golf Grip',
    'ゴルフスタンス': 'Golf Stance',
    'ゴルフアライメント': 'Golf Alignment',
  }
  
  // Parent category mappings (including both English and Japanese subcategories)
  const parentCategories: Record<string, string[]> = {
    'Golf Instruction': [
      'Golf Tips', 'Golf Technique', 'ゴルフ技術', 
      'Golf Lessons', 'Golf Backswing', 'ゴルフバックスイング', 'Golf Swing Technique',
      'ゴルフスイング技術', 'Golf Backswing Mistakes', 'ゴルフバックスイングミス'
    ],
    'Golf Equipment': [
      'Golf Gear', 'Golf Clubs', 'ゴルフクラブ', 
      'Golf Balls', 'ゴルフボール', 'Golf Accessories'
    ],
    'Golf Rules': [
      'Golf Etiquette', 'ゴルフエチケット', 
      'Golf Regulations', 'USGA Rules'
    ],
    'Golf Practice': [
      'Golf Training', 'ゴルフトレーニング', 
      'Golf Drills', 'Practice Tips', 'Golf Exercises'
    ],
    'Beginner Golf': [
      'First Time Golf', 'Golf Basics', 'ゴルフ基礎', 'Getting Started'
    ],
    'Golf Course Management': [
      'Golf Course', 'ゴルフコース', 'Golf Score', 'ゴルフスコア', 
      'Course Strategy', 'Golf Mental Game', 'ゴルフメンタル'
    ],
    'Golf Fundamentals': [
      'Golf Tempo', 'ゴルフテンポ', 'Golf Grip', 'ゴルフグリップ', 
      'Golf Stance', 'ゴルフスタンス', 'Golf Alignment', 'ゴルフアライメント'
    ],
  }
  
  // First pass: ensure all parent categories exist
  const parentCategoryIds: Record<string, string> = {}
  for (const parentTitle of Object.keys(parentCategories)) {
    let parent = await payload.find({
      collection: 'categories',
      where: {
        title: { equals: parentTitle },
      },
    })
    
    if (parent.docs.length === 0) {
      // Create parent category
      parent = await payload.create({
        collection: 'categories',
        data: {
          title: parentTitle,
          slug: parentTitle.toLowerCase().replace(/\s+/g, '-'),
        },
      })
      parentCategoryIds[parentTitle] = parent.id
    } else {
      parentCategoryIds[parentTitle] = parent.docs[0].id
    }
  }
  
  // Second pass: process the categories from the post
  for (const categoryTitle of categories) {
    // Get English title for Japanese categories
    const englishTitle = categoryTranslations[categoryTitle] || categoryTitle
    const isJapanese = categoryTitle !== englishTitle
    
    // Special handling for "ゴルフ指導" which translates to "Golf Instruction" (a parent category)
    if (englishTitle === 'Golf Instruction' || categoryTitle === 'ゴルフ指導') {
      // Just add the parent category
      const parentId = parentCategoryIds['Golf Instruction']
      if (parentId && !addedCategoryIds.has(parentId)) {
        categoryIds.push(parentId)
        addedCategoryIds.add(parentId)
      }
      continue
    }
    
    // Check if category exists (by either Japanese or English title)
    let category = await payload.find({
      collection: 'categories',
      where: {
        or: [
          { slug: { equals: englishTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') } },
          { title: { equals: englishTitle } },
        ],
      },
    })
    
    if (category.docs.length === 0) {
      // Find potential parent category
      let parentId = null
      let parentTitle = null
      
      for (const [pTitle, children] of Object.entries(parentCategories)) {
        if (children.includes(categoryTitle) || children.includes(englishTitle)) {
          parentId = parentCategoryIds[pTitle]
          parentTitle = pTitle
          break
        }
      }
      
      // Create slug from English title
      const slug = englishTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      
      // Create new category with English slug and potential parent
      category = await payload.create({
        collection: 'categories',
        data: {
          title: isJapanese ? `${englishTitle} (${categoryTitle})` : englishTitle,
          slug: slug,
          parent: parentId,
          description: isJapanese ? `Japanese: ${categoryTitle}` : undefined,
        },
      })
      
      // Add the child category
      if (!addedCategoryIds.has(category.id)) {
        categoryIds.push(category.id)
        addedCategoryIds.add(category.id)
      }
      
      // Also add the parent category if it exists
      if (parentId && !addedCategoryIds.has(parentId)) {
        categoryIds.push(parentId)
        addedCategoryIds.add(parentId)
      }
    } else {
      // Category exists, add it
      const existingCategory = category.docs[0]
      if (!addedCategoryIds.has(existingCategory.id)) {
        categoryIds.push(existingCategory.id)
        addedCategoryIds.add(existingCategory.id)
      }
      
      // Find and add parent category if not already added
      if (existingCategory.parent) {
        const parentId = typeof existingCategory.parent === 'string' 
          ? existingCategory.parent 
          : existingCategory.parent.id
        
        if (parentId && !addedCategoryIds.has(parentId)) {
          categoryIds.push(parentId)
          addedCategoryIds.add(parentId)
        }
      }
    }
  }
  
  return categoryIds
}

async function processTags(payload: any, tags: string[]): Promise<string[]> {
  const tagIds: string[] = []
  
  for (const tagTitle of tags) {
    // Check if tag exists
    let tag = await payload.find({
      collection: 'tags',
      where: {
        title: {
          equals: tagTitle,
        },
      },
    })
    
    if (tag.docs.length === 0) {
      // Create new tag
      tag = await payload.create({
        collection: 'tags',
        data: {
          title: tagTitle,
          slug: tagTitle.toLowerCase().replace(/\s+/g, '-'),
        },
      })
      tagIds.push(tag.id)
    } else {
      tagIds.push(tag.docs[0].id)
    }
  }
  
  return tagIds
}

// Removed old functions - now using imported utilities from image-upload.ts

function detectLanguage(filePath: string): 'en' | 'ja' {
  // Check if the path contains japanese folder or -ja suffix
  if (filePath.includes('/japanese/') || filePath.includes('-ja.md')) {
    return 'ja'
  }
  return 'en'
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

// Batch import function for processing multiple folders
export async function batchImportWordPress(
  folders: Array<{ folderPath: string; imagesFolder: string }>,
  options?: { dryRun?: boolean; overwrite?: boolean; removeDuplicates?: boolean }
): Promise<ImportResult[]> {
  const results: ImportResult[] = []
  
  for (const folder of folders) {
    const result = await importWordPressContent({
      ...folder,
      ...options,
    })
    results.push(result)
  }
  
  return results
}