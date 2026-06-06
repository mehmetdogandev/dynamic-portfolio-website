/**
 * Job Registry
 *
 * Central registry for all jobs in the system.
 * Allows jobs to be registered and retrieved by ID.
 */

import { BaseJob } from './types'

class JobRegistry {
  private jobs: Map<string, BaseJob> = new Map()

  /**
   * Register a job
   */
  register(job: BaseJob): void {
    if (this.jobs.has(job.getId())) {
      throw new Error(`Job with ID ${job.getId()} is already registered`)
    }
    this.jobs.set(job.getId(), job)
  }

  /**
   * Get a job by ID
   */
  get(id: string): BaseJob | undefined {
    return this.jobs.get(id)
  }

  /**
   * Get all registered jobs
   */
  getAll(): BaseJob[] {
    return Array.from(this.jobs.values())
  }

  /**
   * Get all enabled jobs
   */
  getEnabled(): BaseJob[] {
    return Array.from(this.jobs.values()).filter((job) => job.isEnabled())
  }

  /**
   * Check if a job is registered
   */
  has(id: string): boolean {
    return this.jobs.has(id)
  }

  /**
   * Unregister a job
   */
  unregister(id: string): boolean {
    return this.jobs.delete(id)
  }

  /**
   * Clear all jobs
   */
  clear(): void {
    this.jobs.clear()
  }
}

// Singleton instance
export const jobRegistry = new JobRegistry()
