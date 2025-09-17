import { getPayload } from 'payload'
import config from '@payload-config'

async function setupCategories() {
  const payload = await getPayload({ config })

  // Define the 5 parent categories and their children
  const categoryStructure = [
    {
      title: 'Fundamentals',
      slug: 'fundamentals',
      description: 'Essential golf knowledge for beginners and foundational concepts',
      order: 1,
      children: [
        { title: 'Getting Started', slug: 'getting-started', description: 'Everything you need to begin your golf journey' },
        { title: 'Basic Techniques', slug: 'basic-techniques', description: 'Fundamental golf techniques and form' },
        { title: 'Golf Basics', slug: 'golf-basics', description: 'Core concepts and basics of the game' },
        { title: 'Terminology & Concepts', slug: 'terminology-concepts', description: 'Golf terms and important concepts' },
      ],
    },
    {
      title: 'Equipment',
      slug: 'equipment',
      description: 'Golf clubs, balls, accessories, and gear guides',
      order: 2,
      children: [
        { title: 'Clubs', slug: 'clubs', description: 'Golf club selection, reviews, and guides' },
        { title: 'Balls & Accessories', slug: 'balls-accessories', description: 'Golf balls, tees, and essential accessories' },
        { title: 'Gear Reviews', slug: 'gear-reviews', description: 'In-depth reviews of golf equipment' },
        { title: 'Equipment Guides', slug: 'equipment-guides', description: 'Comprehensive equipment buying and maintenance guides' },
        { title: 'Technology & Innovation', slug: 'technology-innovation', description: 'Latest golf technology and innovations' },
      ],
    },
    {
      title: 'Skills & Technique',
      slug: 'skills-technique',
      description: 'Improve your golf skills and perfect your technique',
      order: 3,
      children: [
        { title: 'Swing Mechanics', slug: 'swing-mechanics', description: 'Master the golf swing fundamentals' },
        { title: 'Short Game', slug: 'short-game', description: 'Chipping, pitching, and greenside skills' },
        { title: 'Putting', slug: 'putting', description: 'Putting techniques and strategies' },
        { title: 'Practice & Drills', slug: 'practice-drills', description: 'Effective practice routines and drills' },
        { title: 'Problem Solving', slug: 'problem-solving', description: 'Fix common golf problems and mistakes' },
        { title: 'Advanced Techniques', slug: 'advanced-techniques', description: 'Advanced skills for experienced players' },
      ],
    },
    {
      title: 'Playing Golf',
      slug: 'playing-golf',
      description: 'Course management, strategy, and playing conditions',
      order: 4,
      children: [
        { title: 'Course Management', slug: 'course-management', description: 'Navigate the golf course effectively' },
        { title: 'Strategy & Tactics', slug: 'strategy-tactics', description: 'Smart golf strategy and tactical decisions' },
        { title: 'Mental Game', slug: 'mental-game', description: 'Golf psychology and mental preparation' },
        { title: 'Scoring & Improvement', slug: 'scoring-improvement', description: 'Track progress and improve your scores' },
        { title: 'Weather & Conditions', slug: 'weather-conditions', description: 'Playing in different weather and course conditions' },
        { title: 'Different Formats', slug: 'different-formats', description: 'Various golf game formats and variations' },
      ],
    },
    {
      title: 'Golf Life',
      slug: 'golf-life',
      description: 'Golf culture, etiquette, rules, and lifestyle',
      order: 5,
      children: [
        { title: 'Rules & Regulations', slug: 'rules-regulations', description: 'Official golf rules and regulations' },
        { title: 'Etiquette & Culture', slug: 'etiquette-culture', description: 'Golf etiquette and cultural aspects' },
        { title: 'Golf Lifestyle', slug: 'golf-lifestyle', description: 'Living the golf lifestyle' },
        { title: 'Competitions & Events', slug: 'competitions-events', description: 'Tournaments, competitions, and golf events' },
        { title: 'Golf Business', slug: 'golf-business', description: 'Business of golf and industry insights' },
        { title: 'History & Traditions', slug: 'history-traditions', description: 'Golf history and traditions' },
      ],
    },
  ]

  console.log('Setting up golf categories...')

  try {
    // First, create all parent categories
    const parentCategories = new Map()

    for (const parentCategory of categoryStructure) {
      // Check if category already exists
      const existing = await payload.find({
        collection: 'categories',
        where: {
          slug: {
            equals: parentCategory.slug,
          },
        },
        limit: 1,
      })

      let parent
      if (existing.docs.length > 0) {
        parent = existing.docs[0]
        console.log(`Parent category "${parentCategory.title}" already exists`)
      } else {
        parent = await payload.create({
          collection: 'categories',
          data: {
            title: parentCategory.title,
            slug: parentCategory.slug,
            description: parentCategory.description,
            order: parentCategory.order,
          },
        })
        console.log(`Created parent category: ${parentCategory.title}`)
      }

      parentCategories.set(parentCategory.slug, parent)

      // Create child categories
      for (const childCategory of parentCategory.children) {
        const existingChild = await payload.find({
          collection: 'categories',
          where: {
            slug: {
              equals: childCategory.slug,
            },
          },
          limit: 1,
        })

        if (existingChild.docs.length > 0) {
          console.log(`  - Child category "${childCategory.title}" already exists`)
        } else {
          await payload.create({
            collection: 'categories',
            data: {
              title: childCategory.title,
              slug: childCategory.slug,
              description: childCategory.description,
              parent: parent.id,
              order: 0,
            },
          })
          console.log(`  - Created child category: ${childCategory.title}`)
        }
      }
    }

    console.log('\n✅ Category setup completed successfully!')
    console.log('\nCategory structure:')
    for (const category of categoryStructure) {
      console.log(`\n${category.title}`)
      for (const child of category.children) {
        console.log(`  - ${child.title}`)
      }
    }

  } catch (error) {
    console.error('Error setting up categories:', error)
    process.exit(1)
  }

  process.exit(0)
}

setupCategories()