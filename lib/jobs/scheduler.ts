/**
 * Job Scheduler
 *
 * Manages cron-based job scheduling using node-cron.
 * Provides start/stop functionality and job execution tracking.
 */

import type { ScheduledTask } from 'node-cron'
import * as cron from 'node-cron'
import { BaseJob, type JobExecutionContext, type JobResult } from './types'
import { jobRegistry } from './registry'
import { logger } from '@/lib/logger'

export class JobScheduler {
  private tasks: Map<string, ScheduledTask> = new Map()
  private isRunning = false

  /**
   * Start scheduling all enabled jobs
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Job scheduler is already running')
      return
    }

    this.isRunning = true
    const enabledJobs = jobRegistry.getEnabled()

    logger.info(`Starting job scheduler with ${enabledJobs.length} jobs`)

    for (const job of enabledJobs) {
      this.scheduleJob(job)
    }

    logger.info('Job scheduler started successfully')
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    if (!this.isRunning) {
      return
    }

    logger.info('Stopping job scheduler')

    for (const [id, task] of this.tasks.entries()) {
      task.stop()
      this.tasks.delete(id)
      logger.info(`Stopped job: ${id}`)
    }

    this.isRunning = false
    logger.info('Job scheduler stopped')
  }

  /**
   * Schedule a single job
   */
  private scheduleJob(job: BaseJob): void {
    const config = job.getConfig()
    const id = job.getId()
    const schedule = config.schedule?.trim()

    if (!schedule) {
      logger.info(
        `Job ${id} (${config.name}): manual only, not scheduled on cron`
      )
      return
    }

    try {
      if (!cron.validate(schedule)) {
        logger.error(`Invalid cron expression for job ${id}: ${schedule}`)
        return
      }

      const task = cron.schedule(
        schedule,
        async () => {
          await this.executeJob(job)
        },
        {
          timezone: config.timezone ?? 'UTC',
        }
      )

      this.tasks.set(id, task)
      logger.info(
        `Scheduled job: ${id} (${config.name}) with schedule: ${schedule}`
      )
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      logger.error(`Failed to schedule job ${id}: ${errorMessage}`)
    }
  }

  /**
   * Execute a job with error handling and logging
   */
  private async executeJob(job: BaseJob): Promise<void> {
    const config = job.getConfig()
    const id = job.getId()
    const startTime = new Date()

    const context: JobExecutionContext = {
      startTime,
      config,
      attempt: 1,
    }

    try {
      logger.info(`Executing job: ${id} (${config.name})`)

      // Run before hook
      await job['onBeforeExecute'](context)

      // Execute job
      const result: JobResult = await job.execute(context)

      // Run after hook
      await job['onAfterExecute'](context, result)

      const duration = Date.now() - startTime.getTime()

      if (result.success) {
        logger.info(
          `Job ${id} completed successfully in ${duration}ms: ${result.message || ''}`
        )
      } else {
        const errorMessage =
          result.error instanceof Error
            ? result.error.message
            : String(result.error || '')
        logger.error(
          `Job ${id} completed with errors in ${duration}ms: ${result.message || ''}. Error: ${errorMessage}`
        )
      }
    } catch (error) {
      const duration = Date.now() - startTime.getTime()
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      logger.error(`Job ${id} failed after ${duration}ms: ${errorMessage}`)

      // Run error hook
      await job['onError'](context, error as Error)
    }
  }

  /**
   * Manually trigger a job execution
   */
  async triggerJob(jobId: string): Promise<JobResult> {
    const job = jobRegistry.get(jobId)

    if (!job) {
      throw new Error(`Job ${jobId} not found`)
    }

    const startTime = new Date()
    const context: JobExecutionContext = {
      startTime,
      config: job.getConfig(),
      attempt: 1,
    }

    try {
      await job['onBeforeExecute'](context)
      const result = await job.execute(context)
      await job['onAfterExecute'](context, result)
      return result
    } catch (error) {
      await job['onError'](context, error as Error)
      throw error
    }
  }

  /**
   * Check if scheduler is running
   */
  isActive(): boolean {
    return this.isRunning
  }

  /**
   * Get all scheduled task IDs
   */
  getScheduledJobIds(): string[] {
    return Array.from(this.tasks.keys())
  }
}

// Singleton instance
export const jobScheduler = new JobScheduler()
