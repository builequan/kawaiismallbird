import { postgresAdapter } from '@payloadcms/db-postgres'

/**
 * Get database configuration dynamically at runtime
 * This ensures Docker deployments can override DATABASE_URI properly
 */
export function getDatabaseAdapter() {
  // Get DATABASE_URI at runtime, not build time
  const connectionString = process.env.DATABASE_URI

  if (!connectionString) {
    console.error('DATABASE_URI is not set!')
    // Provide a fallback for build time only
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URI must be set in production')
    }
    // Use dummy value for build time
    return postgresAdapter({
      pool: {
        connectionString: 'postgres://dummy:dummy@localhost:5432/dummy',
      },
    })
  }

  console.log('Database connection configured:', connectionString.replace(/:[^@]+@/, ':****@'))

  return postgresAdapter({
    pool: {
      connectionString,
    },
  })
}