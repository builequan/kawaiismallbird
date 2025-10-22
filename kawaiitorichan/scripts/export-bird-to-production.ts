/**
 * Export fresh bird articles from F:\blog\articles\workspace\bird
 * to production-ready SQL dump with correct hero images
 */

import { getPayload } from 'payload'
import config from '../src/payload.config'
import fs from 'fs/promises'
import path from 'path'
import { Payload } from 'payload'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const BIRD_FOLDER = 'F:\\blog\\articles\\workspace\\bird'
const OUTPUT_FILE = 'production-data-fresh-bird.sql'
const COMPRESSED_FILE = 'production-data-fresh-bird.sql.gz'

// Bird-specific categories mapping
const CATEGORY_MAP: Record<string, number> = {
  'budgerigar': 101,
  'cockatiel': 102,
  'lovebird': 103,
  'zebra-finch': 104,
  'society-finch': 105,
  'finch': 106,
  'canary': 107,
  'parrotlet': 108,
  'housing-enclosures': 201,
  'cage-setup': 202,
  'perches-accessories': 203,
  'temperature-humidity': 204,
  'daily-health-care': 301,
  'illness-treatment': 302,
  'vocalizations': 401,
  'behavior-patterns': 402,
  'observation-basics': 501,
  'basic-diet': 601,
  'fresh-foods': 602,
}

function titleToSlug(filename: string): string {
  return filename
    .replace(/_ja\.md$/, '')
    .toLowerCase()
    .replace(/_/g, '-')
}

function extractTitle(content: string): string {
  const titleMatch = content.match(/^#\s+(.+)$/m)
  return titleMatch ? titleMatch[1].trim() : 'Untitled Article'
}

function extractExcerpt(content: string): string {
  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('![')) {
      return trimmed.substring(0, 200)
    }
  }
  return ''
}

function findImages(slug: string, allFiles: string[]): { hero: string | null; section: string | null } {
  const slugBase = slug.replace(/-/g, '')

  const heroImage = allFiles.find(f =>
    f.toLowerCase().includes(slugBase) && f.toLowerCase().includes('-hero.jpg')
  )

  const sectionImage = allFiles.find(f =>
    f.toLowerCase().includes(slugBase) && f.toLowerCase().includes('-section-1.jpg')
  )

  return {
    hero: heroImage || null,
    section: sectionImage || null
  }
}

function inferCategory(slug: string, title: string): number {
  const text = (slug + ' ' + title).toLowerCase()

  // Bird species
  if (text.includes('budgerigar') || text.includes('セキセイ')) return 101
  if (text.includes('cockatiel') || text.includes('オカメ')) return 102
  if (text.includes('lovebird') || text.includes('ラブバード')) return 103
  if (text.includes('finch') || text.includes('フィンチ')) return 104
  if (text.includes('canary') || text.includes('カナリア')) return 107

  // Care topics
  if (text.includes('cage') || text.includes('ケージ')) return 201
  if (text.includes('health') || text.includes('健康')) return 301
  if (text.includes('behavior') || text.includes('行動')) return 401
  if (text.includes('diet') || text.includes('餌') || text.includes('nutrition')) return 601

  // Default to bird species category
  return 101
}

async function uploadImage(payload: Payload, imagePath: string): Promise<number | null> {
  try {
    const imageBuffer = await fs.readFile(imagePath)
    const fileName = path.basename(imagePath)

    const result = await payload.create({
      collection: 'media',
      data: {
        alt: fileName.replace(/\.(jpg|jpeg|png|webp)$/i, '').replace(/-/g, ' '),
      },
      file: {
        data: imageBuffer,
        mimetype: 'image/jpeg',
        name: fileName,
        size: imageBuffer.length,
      },
    })

    console.log(`  ✅ Uploaded image: ${fileName} (ID: ${result.id})`)
    return result.id as number
  } catch (error) {
    console.error(`  ❌ Failed to upload ${imagePath}:`, error)
    return null
  }
}

function markdownToLexical(markdown: string, sectionImageId: number | null): any {
  const lines = markdown.split('\n')
  const children: any[] = []

  let skipFirst = true
  let currentParagraph: string[] = []
  let sectionImageInserted = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Skip the first H1 title
    if (skipFirst && trimmed.startsWith('# ')) {
      skipFirst = false
      continue
    }

    // Insert section image after first ## heading if available
    if (!sectionImageInserted && trimmed.startsWith('## ') && sectionImageId) {
      if (currentParagraph.length > 0) {
        children.push({ type: 'paragraph', children: [{ type: 'text', text: currentParagraph.join('\n') }] })
        currentParagraph = []
      }
      children.push({ type: 'heading', tag: 'h2', children: [{ type: 'text', text: trimmed.replace('## ', '') }] })
      children.push({ type: 'upload', relationTo: 'media', value: sectionImageId })
      sectionImageInserted = true
      continue
    }

    // Handle headings
    if (trimmed.startsWith('### ')) {
      if (currentParagraph.length > 0) {
        children.push({ type: 'paragraph', children: [{ type: 'text', text: currentParagraph.join('\n') }] })
        currentParagraph = []
      }
      children.push({ type: 'heading', tag: 'h3', children: [{ type: 'text', text: trimmed.replace('### ', '') }] })
      continue
    }

    if (trimmed.startsWith('## ')) {
      if (currentParagraph.length > 0) {
        children.push({ type: 'paragraph', children: [{ type: 'text', text: currentParagraph.join('\n') }] })
        currentParagraph = []
      }
      children.push({ type: 'heading', tag: 'h2', children: [{ type: 'text', text: trimmed.replace('## ', '') }] })
      continue
    }

    // Handle empty lines
    if (!trimmed) {
      if (currentParagraph.length > 0) {
        children.push({ type: 'paragraph', children: [{ type: 'text', text: currentParagraph.join('\n') }] })
        currentParagraph = []
      }
      continue
    }

    // Skip images and citations
    if (trimmed.startsWith('![') || trimmed.startsWith('出典:') || trimmed.startsWith('参考:')) {
      continue
    }

    // Accumulate paragraph text
    currentParagraph.push(trimmed)
  }

  // Flush remaining paragraph
  if (currentParagraph.length > 0) {
    children.push({ type: 'paragraph', children: [{ type: 'text', text: currentParagraph.join('\n') }] })
  }

  return {
    root: {
      type: 'root',
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

async function run() {
  console.log('🦜 Starting Bird Articles Import...\n')

  const payload = await getPayload({ config })

  // Step 1: Clear existing data
  console.log('🗑️  Clearing existing posts and media...')
  await payload.delete({ collection: 'posts', where: {} })
  await payload.delete({ collection: 'media', where: {} })
  console.log('✅ Cleared\n')

  // Step 2: Get all bird article files
  const allFiles = await fs.readdir(BIRD_FOLDER)
  const mdFiles = allFiles.filter(f => f.endsWith('_ja.md'))

  console.log(`📁 Found ${mdFiles.length} bird articles\n`)

  let imported = 0
  let failed = 0

  for (const file of mdFiles) {
    const slug = titleToSlug(file)
    console.log(`\n📝 Processing: ${slug}`)

    try {
      const filePath = path.join(BIRD_FOLDER, file)
      const content = await fs.readFile(filePath, 'utf-8')
      const title = extractTitle(content)
      const excerpt = extractExcerpt(content)

      // Find and upload images
      const { hero, section } = findImages(slug, allFiles)
      let heroImageId: number | null = null
      let sectionImageId: number | null = null

      if (hero) {
        const heroPath = path.join(BIRD_FOLDER, hero)
        heroImageId = await uploadImage(payload, heroPath)
      }

      if (section) {
        const sectionPath = path.join(BIRD_FOLDER, section)
        sectionImageId = await uploadImage(payload, sectionPath)
      }

      // Convert markdown to Lexical
      const lexicalContent = markdownToLexical(content, sectionImageId)

      // Infer category
      const categoryId = inferCategory(slug, title)

      // Create post
      const post = await payload.create({
        collection: 'posts',
        data: {
          title,
          slug,
          excerpt,
          content: lexicalContent,
          heroImage: heroImageId,
          heroImageAlt: title,
          categories: [categoryId],
          language: 'ja',
          _status: 'published',
          publishedAt: new Date().toISOString(),
        },
      })

      console.log(`  ✅ Created post: ${title} (ID: ${post.id})`)
      imported++
    } catch (error) {
      console.error(`  ❌ Failed to import ${file}:`, error)
      failed++
    }
  }

  console.log(`\n📊 Import Summary:`)
  console.log(`   ✅ Imported: ${imported}`)
  console.log(`   ❌ Failed: ${failed}`)

  // Step 3: Export to SQL
  console.log(`\n📦 Exporting to SQL...`)

  const dbUri = process.env.DATABASE_URI
  if (!dbUri) {
    throw new Error('DATABASE_URI not set')
  }

  // Parse database connection
  const match = dbUri.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/)
  if (!match) {
    throw new Error('Invalid DATABASE_URI format')
  }

  const [, user, password, host, port, database] = match

  // Export using pg_dump
  const exportCmd = `PGPASSWORD=${password} pg_dump -h ${host} -p ${port} -U ${user} -d ${database} --clean --if-exists --no-owner --no-privileges -f ${OUTPUT_FILE}`

  console.log(`Running: pg_dump...`)
  await execAsync(exportCmd)
  console.log(`✅ Exported to ${OUTPUT_FILE}`)

  // Compress
  const compressCmd = `gzip -f ${OUTPUT_FILE}`
  await execAsync(compressCmd)
  console.log(`✅ Compressed to ${COMPRESSED_FILE}`)

  console.log(`\n🎉 COMPLETE! Use ${COMPRESSED_FILE} for deployment`)

  process.exit(0)
}

run().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
