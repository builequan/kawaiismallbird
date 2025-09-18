import { getPayload } from 'payload'
import configPromise from '@/payload.config'

async function initDatabase() {
  try {
    console.log('Initializing database...')
    console.log('DATABASE_URI:', process.env.DATABASE_URI ? 'Set' : 'Not set')

    const payload = await getPayload({
      config: configPromise,
    })

    console.log('Database connection successful!')

    // Create tables if they don't exist
    await payload.db.connect()

    console.log('Database initialized successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Failed to initialize database:', error)
    process.exit(1)
  }
}

initDatabase()