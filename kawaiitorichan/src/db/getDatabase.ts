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
    // Don't throw error immediately, use a dummy connection
    console.error('WARNING: Using dummy database connection - app may not work fully')
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