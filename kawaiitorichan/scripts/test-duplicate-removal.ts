import { convertMarkdownToLexical } from '../src/utilities/markdown-to-lexical'

async function testDuplicateRemoval() {
  console.log('Testing duplicate title and hero image removal...\n')
  
  // Test content with duplicate title and hero image
  const testMarkdown = `---
title: "初回ゴルフラウンド：なぜ89％が災害後に辞めるのか（サバイバル秘密）"
slug: "first-golf-round-survival-guide"
featured_image: "first-round-hero.webp"
featured_image_alt: "Beginner golfer on first tee"
excerpt: "初めてのゴルフラウンドは緊張するもの。89%のゴルファーが最初の災害的なラウンド後に辞めてしまう理由と、生き残るための秘訣を紹介。"
categories:
  - "Beginner Golf"
tags:
  - "golf tips"
  - "beginner guide"
---

# 初回ゴルフラウンド：なぜ89％が災害後に辞めるのか（サバイバル秘密）

![Beginner golfer on first tee](first-round-hero.webp)

初めてのゴルフラウンドは誰にとっても緊張する経験です。実際、統計によると89％の初心者ゴルファーが最初の災害的なラウンド後にゴルフを諦めてしまいます。

## なぜ初回ラウンドは難しいのか

練習場では上手く打てても、実際のコースでは全く違う環境に直面します。

### 主な理由

1. プレッシャー
2. コース管理の難しさ  
3. ルールとエチケットの複雑さ

## 生き残るための秘訣

成功するための最も重要なポイントは、現実的な期待値を持つことです。`

  console.log('Testing WITH duplicate removal (default)...')
  const resultWithRemoval = await convertMarkdownToLexical(testMarkdown, true)
  
  // Check if title was removed from content
  const contentWithRemoval = JSON.stringify(resultWithRemoval.lexicalContent)
  const hasDuplicateTitle = contentWithRemoval.includes('初回ゴルフラウンド：なぜ89％が災害後に辞めるのか')
  console.log(`  Title in metadata: ${resultWithRemoval.metadata.title}`)
  console.log(`  Duplicate title in content: ${hasDuplicateTitle ? '❌ Found' : '✅ Removed'}`)
  
  // Check if hero image was removed
  const hasDuplicateImage = contentWithRemoval.includes('first-round-hero.webp')
  console.log(`  Featured image in metadata: ${resultWithRemoval.metadata.featured_image}`)
  console.log(`  Duplicate image in content: ${hasDuplicateImage ? '❌ Found' : '✅ Removed'}`)
  
  console.log('\nTesting WITHOUT duplicate removal...')
  const resultWithoutRemoval = await convertMarkdownToLexical(testMarkdown, false)
  
  const contentWithoutRemoval = JSON.stringify(resultWithoutRemoval.lexicalContent)
  const hasTitle = contentWithoutRemoval.includes('初回ゴルフラウンド：なぜ89％が災害後に辞めるのか')
  const hasImage = contentWithoutRemoval.includes('first-round-hero.webp')
  
  console.log(`  Title in content: ${hasTitle ? '✅ Present' : '❌ Missing'}`)
  console.log(`  Image in content: ${hasImage ? '✅ Present' : '❌ Missing'}`)
  
  console.log('\n✅ Test complete!')
  
  // Print first few nodes to verify structure
  console.log('\nFirst 3 nodes WITH duplicate removal:')
  const nodes = resultWithRemoval.lexicalContent.root.children.slice(0, 3)
  nodes.forEach((node: any, i: number) => {
    if (node.type === 'paragraph' && node.children?.[0]?.text) {
      console.log(`  ${i + 1}. ${node.type}: "${node.children[0].text.substring(0, 50)}..."`)
    } else if (node.type === 'heading') {
      const text = node.children?.[0]?.text || ''
      console.log(`  ${i + 1}. ${node.type} (H${node.tag?.replace('h', '')}): "${text}"`)
    } else {
      console.log(`  ${i + 1}. ${node.type}`)
    }
  })
}

testDuplicateRemoval().catch(console.error)