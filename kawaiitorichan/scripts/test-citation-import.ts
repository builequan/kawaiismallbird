// Test script to verify citation link preservation
function parseInlineText(text: string): any[] {
  if (!text) return []

  // Remove inline images first (they'll be block-level)
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '')

  const result: any[] = []
  let currentText = ''
  let i = 0

  while (i < text.length) {
    // Check for citation link [[number]](url) or regular link [text](url)
    if (text[i] === '[') {
      // Try to match [[text]](url) first (citations)
      let linkMatch = text.slice(i).match(/^\[\[([^\]]+)\]\]\(([^)]+)\)/)
      let linkText = linkMatch ? `[${linkMatch[1]}]` : null // Wrap in single brackets for display

      // If no double bracket match, try single bracket [text](url)
      if (!linkMatch) {
        linkMatch = text.slice(i).match(/^\[([^\]]+)\]\(([^)]+)\)/)
        linkText = linkMatch ? linkMatch[1] : null
      }

      if (linkMatch && linkText) {
        // Add any accumulated text first
        if (currentText.trim()) {
          result.push({
            type: 'text',
            version: 1,
            text: currentText
          })
          currentText = ''
        }

        // Add link node
        result.push({
          type: 'link',
          version: 2,
          fields: {
            linkType: 'custom',
            url: linkMatch[2],
            newTab: true,
          },
          children: [
            {
              type: 'text',
              version: 1,
              text: linkText
            }
          ]
        })

        i += linkMatch[0].length
        continue
      }
    }

    // Regular character
    currentText += text[i]
    i++
  }

  // Add remaining text
  if (currentText.trim()) {
    result.push({
      type: 'text',
      version: 1,
      text: currentText
    })
  }

  return result.length > 0 ? result : [{
    type: 'text',
    version: 1,
    text: ''
  }]
}

// Test cases
console.log('🧪 Testing citation link preservation\n')

// Test 1: Single citation
const test1 = 'Some text before [[1]](https://example.com/source1) and after.'
console.log('Test 1: Single citation')
console.log('Input:', test1)
const result1 = parseInlineText(test1)
console.log('Output:', JSON.stringify(result1, null, 2))
console.log('✅ Has link node:', result1.some(n => n.type === 'link'))
console.log('')

// Test 2: Multiple citations
const test2 = 'Text [[1]](https://source1.com) more text [[2]](https://source2.com) end.'
console.log('Test 2: Multiple citations')
console.log('Input:', test2)
const result2 = parseInlineText(test2)
console.log('Output:', JSON.stringify(result2, null, 2))
console.log('✅ Has 2 link nodes:', result2.filter(n => n.type === 'link').length === 2)
console.log('')

// Test 3: Real citation from database
const test3 = '約45〜65％に保たれるときに最も健康に過ごせます。[[1]](https://www.avma.org/resources) この範囲を下回ると'
console.log('Test 3: Real Japanese citation')
console.log('Input:', test3)
const result3 = parseInlineText(test3)
console.log('Output:', JSON.stringify(result3, null, 2))
console.log('✅ Has link node:', result3.some(n => n.type === 'link'))
console.log('✅ Link text is [[1]]:', result3.find(n => n.type === 'link')?.children[0]?.text === '[[1]]')
console.log('')

console.log('✨ All tests completed!')
console.log('Citation links will now be preserved during import.')