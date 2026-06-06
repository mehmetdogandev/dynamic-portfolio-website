import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

// Same DB as the app (database-utils uses DATABASE_URL). STUDIO_DB_URL is fallback only.
const dbUrl = process.env.DATABASE_URL || process.env.STUDIO_DB_URL

if (!dbUrl) {
  throw new Error(
    'DATABASE_URL or STUDIO_DB_URL is not defined in environment variables'
  )
}

export default defineConfig({
  out: './drizzle',
  schema: './lib/db/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: dbUrl,
  },
})
