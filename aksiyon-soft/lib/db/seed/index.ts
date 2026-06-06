// get every file in this folder except index.ts and run the seed function if it exists
import { existsSync, readdirSync } from 'fs'
import { join, extname, dirname } from 'path'
import { fileURLToPath } from 'url'
import { closeAllConnections } from '../database-utils'

// Cross-platform way to get current directory
const __filename = fileURLToPath(import.meta.url)
const seedersDir = dirname(__filename)

/**
 * Sunucuda `pnpm db:seed` çoğunlukla **Docker dışındaki** Node ile çalışır;
 * `S3_ENDPOINT=minio` orada DNS’te yoktur. Konteyner içinde `/.dockerenv` vardır
 * ve `minio` çözülür — override gerekmez.
 * DNS lookup yerine `/.dockerenv` kullanırız (EAI_AGAIN gibi dalgalı DNS hatalarından kaçınmak için).
 */
function applyHostOnlyMinioS3Override(): void {
  if (process.env.S3_HOST_OVERRIDE?.trim()) {
    return
  }
  if (process.env.S3_ENDPOINT?.trim() !== 'minio') {
    return
  }
  if (existsSync('/.dockerenv')) {
    return
  }
  process.env.S3_HOST_OVERRIDE = '127.0.0.1'
  console.log(
    'S3: host db:seed → S3_HOST_OVERRIDE=127.0.0.1 (MinIO host portu; yalnız bu süreç)'
  )
}

/**
 * Automated database seeding orchestrator.
 *
 * This function dynamically discovers and executes all seeder files in the current directory:
 * - Scans directory for TypeScript files (excluding index.ts)
 * - Imports each seeder module and checks for exported `seed` function
 * - Executes seed functions sequentially to populate database with initial data
 * - Provides console feedback for monitoring seeding progress
 *
 * Seeder files should export a `seed` function that performs database population:
 * ```typescript
 * // plan.ts
 * export async function seed() {
 *   await db.insert(plan).values(defaultPlans)
 * }
 * ```
 *
 * This approach enables:
 * - Modular seeding by domain (users, plans, categories, etc.)
 * - Easy addition of new seeders without modifying orchestrator
 * - Clear separation of seeding concerns
 * - Consistent seeding patterns across the application
 *
 * @throws {Error} If any seeder function fails during execution
 */
export async function seedDatabase() {
  applyHostOnlyMinioS3Override()
  const files = readdirSync(seedersDir).sort((a, b) => a.localeCompare(b))

  for (const file of files) {
    if (file === 'index.ts' || extname(file) !== '.ts') continue

    // Cross-platform path handling for dynamic imports
    const seederPath = join(seedersDir, file)

    // Convert Windows backslashes to forward slashes for URL compatibility
    const normalizedPath = seederPath.replace(/\\/g, '/')

    // Create proper file URL
    const seederUrl = normalizedPath.startsWith('/')
      ? `file://${normalizedPath}`
      : `file:///${normalizedPath}`

    try {
      const seederModule = await import(seederUrl)

      if (seederModule.seed && typeof seederModule.seed === 'function') {
        console.log(`Seeding data from ${file}...`)
        await seederModule.seed()
        console.log(`✓ Completed seeding from ${file}`)
      }
    } catch (error) {
      console.error(`❌ Error importing/running seeder ${file}:`, error)
      throw error
    }
  }
}

/**
 * Cleanup all database connections after seeding.
 * This prevents connection pool leaks.
 */
async function cleanupConnections() {
  try {
    console.log('Cleaning up database connections...')
    await closeAllConnections()
    console.log('✓ Database connections cleaned up')
  } catch (error) {
    console.error('Error cleaning up connections:', error)
  }
}

/**
 * Main seeding execution block.
 *
 * Runs the complete database seeding process and handles:
 * - Successful completion logging
 * - Error handling and reporting
 * - Connection cleanup
 * - Graceful process termination
 *
 * This allows the seeder to be run directly via Node.js:
 * ```bash
 * npx tsx lib/db/seed/index.ts
 * ```
 */
;(async () => {
  try {
    applyHostOnlyMinioS3Override()
    await seedDatabase()
    console.log('Database seeding completed.')
  } catch (error) {
    console.error('Error during database seeding:', error)
    throw error
  } finally {
    await cleanupConnections()
    process.exit()
  }
})()
