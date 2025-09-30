import { getPayload } from 'payload'
import config from '@payload-config'

async function fixSinglePost() {
  const payload = await getPayload({ config })

  const post = await payload.findByID({
    collection: 'posts',
    id: 1731,
    depth: 0,
  })

  console.log('Before fix:')
  console.log(JSON.stringify(post.content).slice(0, 500))

  const fixedContent = fixCitationsInContent(post.content)

  await payload.update({
    collection: 'posts',
    id: 1731,
    data: {
      content: fixedContent,
    },
  })

  console.log('\n✅ Fixed post 1731')
  process.exit(0)
}

function fixCitationsInContent(content: any): any {
  if (!content) return content

  if (typeof content === 'string') {
    return content.replace(/\[\[(\d+)\]\]\([^)]+\)/g, '[$1]')
  }

  if (Array.isArray(content)) {
    return content.map(item => fixCitationsInContent(item))
  }

  if (typeof content === 'object') {
    const fixed: any = {}
    for (const key in content) {
      if (key === 'text' && typeof content[key] === 'string') {
        fixed[key] = content[key].replace(/\[\[(\d+)\]\]\([^)]+\)/g, '[$1]')
      } else {
        fixed[key] = fixCitationsInContent(content[key])
      }
    }
    return fixed
  }

  return content
}

fixSinglePost()