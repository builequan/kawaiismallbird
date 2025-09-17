#!/usr/bin/env tsx
/**
 * Diagnose broken word linking issues in internal and affiliate links
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'

interface LinkInfo {
  type: 'internal' | 'affiliate'
  anchorText: string
  url?: string
  targetSlug?: string
  context: string
}

function extractLinksFromContent(content: any): LinkInfo[] {
  const links: LinkInfo[] = []

  function traverse(node: any, parentText: string = ''): void {
    if (!node) return

    if (node.type === 'link') {
      const anchorText = extractText(node)
      const linkInfo: LinkInfo = {
        type: node.fields?.linkType === 'internal' ? 'internal' : 'affiliate',
        anchorText: anchorText,
        url: node.fields?.url,
        targetSlug: node.fields?.doc?.value,
        context: parentText
      }
      links.push(linkInfo)
    }

    if (node.children && Array.isArray(node.children)) {
      const nodeText = extractText(node)
      node.children.forEach((child: any) => traverse(child, nodeText))
    }
  }

  function extractText(node: any): string {
    if (!node) return ''
    if (node.text) return node.text
    if (node.children && Array.isArray(node.children)) {
      return node.children.map(extractText).join('')
    }
    return ''
  }

  if (content?.root) {
    traverse(content.root)
  }

  return links
}

function checkForBrokenWords(links: LinkInfo[]): Array<{link: LinkInfo; issue: string}> {
  const issues: Array<{link: LinkInfo; issue: string}> = []

  const problematicPatterns = [
    // Check for incomplete Japanese words
    { pattern: /^パラ$/, expected: 'パラレル or パラメーター', issue: 'Incomplete word "パラ"' },
    { pattern: /^スコア$/, expected: 'スコアカード', issue: 'Could be "スコアカード"' },
    { pattern: /^プレー$/, expected: 'プレーヤー', issue: 'Could be "プレーヤー"' },
    { pattern: /^ヤー$/, expected: 'プレーヤー', issue: 'Fragment "ヤー" from "プレーヤー"' },
    // Check for word fragments
    { pattern: /^[ァ-ヴ]{1,2}$/, expected: 'Complete word', issue: 'Single or double kana fragment' }
  ]

  for (const link of links) {
    // Check if anchor text is a fragment
    if (link.anchorText.length <= 2 && /[ァ-ヴ]/.test(link.anchorText)) {
      issues.push({
        link,
        issue: `Suspiciously short Japanese text: "${link.anchorText}"`
      })
    }

    // Check against known problematic patterns
    for (const {pattern, issue} of problematicPatterns) {
      if (pattern.test(link.anchorText)) {
        issues.push({ link, issue })
      }
    }

    // Check if the anchor text appears to be a broken word by checking context
    if (link.context) {
      const anchorIndex = link.context.indexOf(link.anchorText)
      if (anchorIndex > 0) {
        const charBefore = link.context[anchorIndex - 1]
        const charAfter = link.context[anchorIndex + link.anchorText.length]

        // Check if surrounded by Japanese characters (likely broken word)
        if (/[ぁ-んァ-ヴ一-龯]/.test(charBefore) || /[ぁ-んァ-ヴ一-龯]/.test(charAfter)) {
          issues.push({
            link,
            issue: `Link breaks a word - before: "${charBefore}", after: "${charAfter}"`
          })
        }
      }
    }
  }

  return issues
}

async function main() {
  console.log('🔍 Diagnosing Broken Word Linking Issues')
  console.log('=' .repeat(60))

  const payload = await getPayload({ config: configPromise })

  try {
    // Get all posts
    const posts = await payload.find({
      collection: 'posts',
      limit: 100,
      depth: 0,
    })

    console.log(`📊 Analyzing ${posts.docs.length} posts...`)
    console.log('')

    let totalIssues = 0
    const issuesByType = {
      internal: 0,
      affiliate: 0
    }

    for (const post of posts.docs) {
      if (!post.content?.root) continue

      const links = extractLinksFromContent(post.content)
      const issues = checkForBrokenWords(links)

      if (issues.length > 0) {
        console.log(`\n📝 ${post.title || post.slug}`)
        console.log(`   URL: /${post.slug}`)

        for (const {link, issue} of issues) {
          console.log(`   ⚠️  ${link.type} link: "${link.anchorText}"`)
          console.log(`      Issue: ${issue}`)
          if (link.context && link.context.length < 100) {
            console.log(`      Context: "${link.context}"`)
          }
          issuesByType[link.type]++
          totalIssues++
        }
      }
    }

    // Summary
    console.log('\n' + '=' .repeat(60))
    console.log('📊 Summary:')
    console.log(`   Total issues found: ${totalIssues}`)
    console.log(`   Internal link issues: ${issuesByType.internal}`)
    console.log(`   Affiliate link issues: ${issuesByType.affiliate}`)

    if (totalIssues > 0) {
      console.log('\n🔧 Recommendations:')
      console.log('   1. Update word boundary detection in linking scripts')
      console.log('   2. Add Japanese-specific word segmentation')
      console.log('   3. Implement minimum anchor text length (3+ characters)')
      console.log('   4. Check for complete words before creating links')
    }

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await payload.db.destroy()
  }
}

main().catch(console.error)