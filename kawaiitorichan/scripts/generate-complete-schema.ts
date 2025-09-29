import { migratePostgres } from '@payloadcms/db-postgres'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import path from 'path'
import { config } from 'dotenv'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

config({ path: path.resolve(dirname, '../../.env') })

async function generateSchema() {
  console.log('🚀 Generating complete Payload schema...')

  // Create a temporary database connection
  const adapter = {
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
    push: false,
    migrationDir: path.resolve(dirname, '../src/migrations'),
  }

  try {
    // Run migrations to ensure schema is up to date
    await migratePostgres({
      payload: {} as any,
      migrateStatus: false,
    })

    console.log('✅ Schema generation complete!')
    console.log('📝 Now export the schema using pg_dump')

    // Output the command to run
    const dbUri = process.env.DATABASE_URI
    const match = dbUri?.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/)

    if (match) {
      const [, user, pass, host, port, dbname] = match
      console.log(`
Run this command to export the complete schema:

PGPASSWORD=${pass} pg_dump -h ${host} -p ${port} -U ${user} -d ${dbname} \\
  --schema-only --no-owner --no-acl --no-comments \\
  -f payload-complete-schema.sql

Then combine with data:

cat payload-complete-schema.sql > complete-import.sql
echo "" >> complete-import.sql
cat quick-import.sql >> complete-import.sql
gzip complete-import.sql
      `)
    }
  } catch (error) {
    console.error('❌ Error generating schema:', error)
    process.exit(1)
  }
}

generateSchema()