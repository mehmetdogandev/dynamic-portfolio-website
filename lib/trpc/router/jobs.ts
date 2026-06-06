/**
 * Jobs Management Router
 *
 * Provides endpoints for managing and triggering background jobs
 */

import { router, rbacProcedure, createAdminListSchema } from '../index'
import { paginatedListResponse } from '../admin-list'
import { SCOPES, PERMISSIONS } from '@/lib/db/schema'
import { z } from 'zod'
import { jobScheduler, jobRegistry } from '@/lib/jobs'
import { TRPCError } from '@trpc/server'

type JobListRow = {
  id: string
  name: string
  description: string | undefined
  schedule: string | null | undefined
  enabled: boolean | undefined
  timezone: string | undefined
}

export const jobsRouter = router({
  /**
   * List all registered jobs
   */
  list: rbacProcedure(SCOPES.JOB, PERMISSIONS.READ)
    .input(createAdminListSchema(['name']))
    .query(async ({ input }) => {
      const { page, limit, search, sortBy, sortOrder } = input

      let jobs: JobListRow[] = jobRegistry.getAll().map((job) => {
        const config = job.getConfig()
        return {
          id: config.id,
          name: config.name,
          description: config.description,
          schedule: config.schedule,
          enabled: config.enabled,
          timezone: config.timezone,
        }
      })

      if (search) {
        const needle = search.trim().toLowerCase()
        jobs = jobs.filter(
          (job) =>
            job.name.toLowerCase().includes(needle) ||
            (job.description?.toLowerCase().includes(needle) ?? false) ||
            job.id.toLowerCase().includes(needle)
        )
      }

      jobs.sort((a, b) => {
        const left = sortBy === 'name' ? a.name : a.id
        const right = sortBy === 'name' ? b.name : b.id
        const cmp = left.localeCompare(right, 'tr')
        return sortOrder === 'asc' ? cmp : -cmp
      })

      const total = jobs.length
      const offset = (page - 1) * limit
      const data = jobs.slice(offset, offset + limit)

      return paginatedListResponse(data, total, page, limit)
    }),

  /**
   * Manually trigger a job execution
   */
  trigger: rbacProcedure(SCOPES.JOB, PERMISSIONS.UPDATE)
    .input(
      z.object({
        jobId: z.string().min(1, 'Job ID is required'),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await jobScheduler.triggerJob(input.jobId)
        return {
          success: result.success,
          message: result.message,
          duration: result.duration,
          data: result.data,
        }
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to trigger job',
          cause: error,
        })
      }
    }),

  /**
   * Get job scheduler status
   */
  status: rbacProcedure(SCOPES.JOB, PERMISSIONS.READ).query(async () => {
    return {
      isActive: jobScheduler.isActive(),
      jobCount: jobRegistry.getAll().length,
      enabledJobCount: jobRegistry.getEnabled().length,
    }
  }),
})
