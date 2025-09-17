import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function testReferences() {
  const payload = await getPayload({ config: configPromise })

  // Get a recent post to test with
  const posts = await payload.find({
    collection: 'posts',
    limit: 1,
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  if (posts.docs.length === 0) {
    console.log('No published posts found')
    return
  }

  const post = posts.docs[0]
  console.log(`Testing with post: ${post.title}`)

  // Add reference content to the post
  const updatedContent = {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: [
        ...post.content.root.children,
        {
          type: 'heading',
          format: '',
          indent: 0,
          version: 1,
          tag: 'h2',
          children: [
            {
              type: 'text',
              format: 0,
              text: '出典・参考文献出典・参考文献',
              version: 1,
            },
          ],
        },
        {
          type: 'list',
          format: '',
          indent: 0,
          version: 1,
          listType: 'number',
          start: 1,
          tag: 'ol',
          children: [
            {
              type: 'listitem',
              format: '',
              indent: 0,
              version: 1,
              value: 1,
              children: [
                {
                  type: 'text',
                  format: 0,
                  text: '「アメリカで最も難しいゴルフコース」は、独自の建築様式と高速グリーンで知られるペンシルベニアの場所ですリンク: ',
                  version: 1,
                },
                {
                  type: 'text',
                  format: 0,
                  text: 'https://www.msn.com/en-us/sports/golf/the-hardest-golf-course-in-america-is-a-pennsylvania-spot-known-for-unique-architecture-and-fast-greens/ar-AA1IUPFq?ocid=BingNewsVerp',
                  version: 1,
                },
              ],
            },
            {
              type: 'listitem',
              format: '',
              indent: 0,
              version: 1,
              value: 2,
              children: [
                {
                  type: 'text',
                  format: 0,
                  text: 'Golf Digest Japan - 2024年コースランキング: ',
                  version: 1,
                },
                {
                  type: 'text',
                  format: 0,
                  text: 'https://www.golfdigest.co.jp/rankings/2024',
                  version: 1,
                },
              ],
            },
            {
              type: 'listitem',
              format: '',
              indent: 0,
              version: 1,
              value: 3,
              children: [
                {
                  type: 'text',
                  format: 0,
                  text: 'Japan Golf Association Official Guidelines: ',
                  version: 1,
                },
                {
                  type: 'text',
                  format: 0,
                  text: 'https://www.jga.or.jp/guidelines',
                  version: 1,
                },
              ],
            },
          ],
        },
      ],
    },
  }

  // Update the post with references
  await payload.update({
    collection: 'posts',
    id: post.id,
    data: {
      content: updatedContent,
    },
  })

  console.log('References added to post successfully!')
  console.log('View the post at: http://localhost:3000/posts/' + post.slug)
}

testReferences()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })