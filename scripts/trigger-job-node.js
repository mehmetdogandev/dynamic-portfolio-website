/**
 * Production container için Node.js ile job tetikleme scripti
 *
 * Production Docker image'da pnpm ve tsx olmadığı için,
 * bu script compiled JavaScript olarak çalışır.
 *
 * Kullanım:
 *   node scripts/trigger-job-node.js <job-id>
 *
 * Örnek:
 *   node scripts/trigger-job-node.js unread-messages-notification
 */

async function main() {
  // Dynamic import to handle ES modules in Next.js standalone output
  // In Next.js standalone mode, lib directory should be at the root
  let jobScheduler, jobRegistry
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path')

  // Get the script directory and app root
  const scriptDir = __dirname
  const appRoot = path.resolve(scriptDir, '..')

  // Try multiple possible paths (relative to app root)
  const possiblePaths = [
    path.join(appRoot, 'lib', 'jobs'),
    path.join(appRoot, 'lib', 'jobs', 'index.js'),
    '../lib/jobs',
    '../lib/jobs/index.js',
  ]

  let imported = false
  let lastError

  for (const modulePath of possiblePaths) {
    try {
      let importPath
      if (path.isAbsolute(modulePath)) {
        // Convert absolute path to file:// URL (handle Windows paths)
        importPath = `file://${modulePath.replace(/\\/g, '/')}`
      } else {
        // Use relative path as-is (Node.js will resolve it)
        importPath = modulePath
      }

      const jobsModule = await import(importPath)
      if (jobsModule.jobScheduler && jobsModule.jobRegistry) {
        jobScheduler = jobsModule.jobScheduler
        jobRegistry = jobsModule.jobRegistry
        imported = true
        console.log(`✓ Successfully loaded jobs module from: ${modulePath}`)
        break
      }
    } catch (error) {
      lastError = error
      // Continue to next path
    }
  }

  if (!imported) {
    console.error('❌ Failed to import jobs module from any expected location:')
    possiblePaths.forEach((p, i) => {
      const fullPath = path.isAbsolute(p) ? p : path.resolve(scriptDir, p)
      console.error(`  ${i + 1}. ${fullPath}`)
    })
    console.error('\nLast error:', lastError?.message || 'Unknown error')
    if (lastError?.code) {
      console.error('Error code:', lastError.code)
    }
    process.exit(1)
  }
  const jobId = process.argv[2]

  if (!jobId) {
    console.error('❌ Job ID is required')
    console.log('\nUsage: node scripts/trigger-job-node.js <job-id>')
    console.log('\nAvailable jobs:')
    const jobs = jobRegistry.getAll()
    jobs.forEach((job) => {
      const config = job.getConfig()
      console.log(`  - ${config.id}: ${config.name}`)
    })
    process.exit(1)
  }

  const job = jobRegistry.get(jobId)
  if (!job) {
    console.error(`❌ Job "${jobId}" not found`)
    console.log('\nAvailable jobs:')
    const jobs = jobRegistry.getAll()
    jobs.forEach((job) => {
      const config = job.getConfig()
      console.log(`  - ${config.id}: ${config.name}`)
    })
    process.exit(1)
  }

  console.log(`🚀 Triggering job: ${jobId}...`)
  console.log(`📋 Name: ${job.getConfig().name}`)
  console.log(`📝 Description: ${job.getConfig().description}\n`)

  try {
    const startTime = Date.now()
    const result = await jobScheduler.triggerJob(jobId)
    const duration = Date.now() - startTime

    console.log('\n✅ Job completed!')
    console.log(
      `⏱️  Duration: ${duration}ms (${result.duration || 'N/A'}ms reported)`
    )
    console.log(`📊 Success: ${result.success ? '✅ Yes' : '❌ No'}`)
    console.log(`💬 Message: ${result.message || 'No message'}`)

    if (result.data) {
      console.log(`📦 Data:`, JSON.stringify(result.data, null, 2))
    }

    if (!result.success) {
      console.error(`❌ Error:`, result.error)
      process.exit(1)
    }
  } catch (error) {
    console.error(
      '\n❌ Job failed:',
      error instanceof Error ? error.message : String(error)
    )
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack)
    }
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
