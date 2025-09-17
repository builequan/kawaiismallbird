import payload from 'payload'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

const updateHeroText = async () => {
  const payloadInstance = await getPayload({ config: configPromise })

  try {
    // Find the homepage
    const pages = await payloadInstance.find({
      collection: 'pages',
      where: {
        slug: {
          equals: 'home'
        }
      },
      depth: 2
    })

    if (pages.docs.length === 0) {
      console.log('Homepage not found')
      return
    }

    const homepage = pages.docs[0]
    console.log('Found homepage:', homepage.id)

    // Update hero content to remove sale text
    const updatedHeroContent = {
      type: 'lowImpact',
      richText: {
        root: {
          type: 'root',
          children: [
            {
              type: 'heading',
              tag: 'h1',
              children: [
                {
                  type: 'text',
                  text: 'あなたの愛鳥ライフを',
                  format: 1 // Bold
                }
              ]
            },
            {
              type: 'heading',
              tag: 'h1',
              children: [
                {
                  type: 'text',
                  text: '完全サポート！',
                  format: 1 // Bold
                }
              ]
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: '野鳥観察から飼育まで、すべての鳥好きのためのワンストップショップ'
                }
              ]
            }
          ]
        }
      }
    }

    // Update the page
    const updatedPage = await payloadInstance.update({
      collection: 'pages',
      id: homepage.id,
      data: {
        hero: updatedHeroContent
      },
      context: {
        disableRevalidate: true
      }
    })

    console.log('✅ Homepage hero updated successfully')
    console.log('Hero text now displays without sale banner')

  } catch (error) {
    console.error('Error updating hero:', error)
  }

  process.exit(0)
}

updateHeroText()