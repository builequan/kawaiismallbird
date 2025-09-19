import { getPayload } from 'payload'
import config from '../src/payload.config'

async function listCategories() {
  const payload = await getPayload({ config })
  const { docs: categories } = await payload.find({
    collection: 'categories',
    limit: 50,
  })

  console.log('All Categories:')
  categories.forEach(cat => {
    console.log(`  ${cat.slug}: ${cat.title} ${cat.parent ? '(child)' : '(parent)'}`)
  })

  process.exit(0)
}

listCategories().catch(console.error)