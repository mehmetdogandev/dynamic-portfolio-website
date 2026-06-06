/**
 * Job Types and Interfaces
 *
 * Defines the structure for scheduled jobs in the system.
 */

export interface JobConfig {
  /** Unique identifier for the job */
  id: string
  /** Human-readable name */
  name: string
  /**
   * Cron expression (e.g. "0 1 * * *" for daily at 1 AM).
   * Omit or leave empty for manual-only jobs (no automatic runs).
   */
  schedule?: string | null
  /** Timezone for the schedule (defaults to UTC) */
  timezone?: string
  /** Whether the job is enabled */
  enabled?: boolean
  /** Description of what the job does */
  description?: string
}

export interface JobResult {
  success: boolean
  message?: string
  error?: Error
  data?: unknown
  duration?: number // in milliseconds
}

export interface JobExecutionContext {
  /** Timestamp when job execution started */
  startTime: Date
  /** Job configuration */
  config: JobConfig
  /** Execution attempt number (for retries) */
  attempt: number
}

/**
 * Abstract base class for all jobs
 */
export abstract class BaseJob {
  protected config: JobConfig

  constructor(config: JobConfig) {
    this.config = {
      ...config,
      enabled: config.enabled ?? true,
      timezone: config.timezone ?? 'UTC',
    }
  }

  /**
   * Get the job configuration
   */
  getConfig(): JobConfig {
    return this.config
  }

  /**
   * Get the job ID
   */
  getId(): string {
    return this.config.id
  }

  /**
   * Check if the job is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled ?? true
  }

  /**
   * Execute the job logic
   * Must be implemented by subclasses
   */
  abstract execute(context: JobExecutionContext): Promise<JobResult>

  /**
   * Called before job execution (for setup)
   */
  protected async onBeforeExecute(
    _context: JobExecutionContext
  ): Promise<void> {
    // Override in subclasses if needed
  }

  /**
   * Called after job execution (for cleanup)
   */
  protected async onAfterExecute(
    _context: JobExecutionContext,
    _result: JobResult
  ): Promise<void> {
    // Override in subclasses if needed
  }

  /**
   * Called when job execution fails
   */
  protected async onError(
    _context: JobExecutionContext,
    _error: Error
  ): Promise<void> {
    // Override in subclasses if needed
    console.error(`Job ${this.config.id} failed:`, _error)
  }
}
