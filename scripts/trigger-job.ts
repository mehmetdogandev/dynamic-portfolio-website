/**
 * Script to manually trigger a job
 *
 * Usage:
 *   pnpm tsx scripts/trigger-job.ts <job-id>
 *
 * Examples:
 *   pnpm tsx scripts/trigger-job.ts annual-leave-accrual
 *   pnpm tsx scripts/trigger-job.ts non-annual-leave-accrual
 */

import { jobScheduler, jobRegistry } from '../lib/jobs'

async function main() {
  const jobId = process.argv[2]

  if (!jobId) {
    console.error('❌ Job ID is required')
    console.log('\nUsage: pnpm tsx scripts/trigger-job.ts <job-id>')
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
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
