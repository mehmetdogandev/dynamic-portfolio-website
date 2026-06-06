export const runtime = 'nodejs'

/**
 * Job System Initialization
 *
 * Registers all jobs and exports the scheduler.
 */

import { jobRegistry } from './registry'
import { jobScheduler } from './scheduler'
import { DatabaseBackupJob } from './backup/database-backup'

// Manual only: no cron; trigger from admin Jobs panel
const databaseBackupJob = new DatabaseBackupJob()
jobRegistry.register(databaseBackupJob)

// Export scheduler for starting/stopping
export { jobScheduler, jobRegistry }

// Export job types
export * from './types'

// Singleton initialization flag
let isInitialized = false
const initLock = { locked: false }

/**
 * Initialize and start the job scheduler (lazy initialization)
 * Safe to call multiple times - will only start once
 */
export function startJobScheduler(): void {
  // Prevent concurrent initialization attempts
  if (initLock.locked) {
    return
  }

  if (isInitialized || jobScheduler.isActive()) {
    return
  }

  initLock.locked = true
  try {
    console.log('[Job Scheduler] Initializing...')
    jobScheduler.start()
    isInitialized = true
    console.log('[Job Scheduler] Initialized successfully')
  } catch (error) {
    console.error('[Job Scheduler] Failed to start:', error)
    throw error
  } finally {
    initLock.locked = false
  }
}

/**
 * Stop the job scheduler
 * Call this during application shutdown
 */
export function stopJobScheduler(): void {
  try {
    jobScheduler.stop()
    isInitialized = false
    console.log('[Job Scheduler] Stopped')
  } catch (error) {
    console.error('[Job Scheduler] Failed to stop:', error)
  }
}

// NOTE: Job scheduler should ONLY be initialized via instrumentation.ts
// Do NOT auto-initialize here to prevent multiple initializations during hot reload
// The instrumentation.ts hook runs once when Next.js server starts
