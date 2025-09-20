import { postgresAdapter } from '@payloadcms/db-postgres'

/**
 * Get database configuration dynamically at runtime
 * This ensures Docker deployments can override DATABASE_URI properly
 */
export function getDatabaseAdapter() {
  // During build phase, use a dummy adapter that won't try to connect
  const isBuildPhase = process.env.NODE_ENV === 'production' &&
                       (process.env.SKIP_DB_PUSH === 'true' ||
                        process.env.SKIP_BUILD_STATIC_GENERATION === 'true' ||
                        process.argv.includes('build'))

  // Get DATABASE_URI at runtime, not build time
  const connectionString = process.env.DATABASE_URI

  if (isBuildPhase) {
    console.log('Build phase detected - using dummy database configuration')
    // Return a valid adapter that won't attempt connections during build
    return postgresAdapter({
      pool: {
        connectionString: connectionString || 'postgresql://build:build@localhost:5432/build',
        // Disable actual connections during build
        max: 0,
        min: 0,
        idleTimeoutMillis: 1,
      },
      push: false, // Don't push schema during build
    })
  }

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