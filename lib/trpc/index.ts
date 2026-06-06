import { initTRPC, TRPCError } from '@trpc/server'
import { cache } from 'react'
import superjson from 'superjson'
import { PERMISSIONS, SCOPES } from '../db/schema'
import {
  canCached as can,
  rbacCached as rbac,
  hasGlobalAccessForScope,
} from '../utils/rbac-cached'
import z from 'zod/v4'
import { createAuthInstance } from '../auth/database'
import { getDbConnection } from '../db/database-utils'
import { getTableColumns } from 'drizzle-orm'
import { PgColumn, PgTable } from 'drizzle-orm/pg-core'
import { trpcLogger } from '../logger'
import { createAuditToolkit, createAuditedDb } from './utils/audit-meta'

/**
 * TRPC context: single auth instance and single database connection per request.
 *
 * @param opts - TRPC context options with headers
 * @returns Context with auth, database, session, and RBAC helpers
 */
export const createTRPCContext = cache(async (opts: { headers: Headers }) => {
  const auth = createAuthInstance()
  const db = getDbConnection()
  const session = await auth.api.getSession({ headers: opts.headers })
  const auditUserId = session?.user?.id ?? null

  // Helper function to check if request is HTTPS
  const isHttpsRequest = (): boolean => {
    const forwardedProto = opts.headers.get('x-forwarded-proto')
    const forwardedSsl = opts.headers.get('x-forwarded-ssl')
    const referer = opts.headers.get('referer')

    return (
      forwardedProto === 'https' ||
      forwardedSsl === 'on' ||
      (referer !== null && referer.startsWith('https://'))
    )
  }

  const audit = createAuditToolkit(auditUserId)
  const auditedDb = createAuditedDb(db, audit)

  return {
    session,
    headers: opts.headers,
    auth,
    db: auditedDb,
    isHttpsRequest,
    rbac: {
      hasGlobalAccess: false,
    },
    columnAccess: {
      /** Column-level RBAC removed; after procedure passes READ/WRITE, all table columns are selectable. */
      getFilteredSelect: async <
        T extends PgTable,
        TColumns = {
          [K in keyof T as T[K] extends PgColumn ? K : never]?: T[K] | undefined
        },
      >(
        table: T
      ): Promise<TColumns> => {
        return getTableColumns(table) as TColumns
      },
      validateReadAccess: async (_fields: string[]) => {
        // Column-level RBAC removed; procedure-level READ is sufficient.
      },
      validateWriteAccess: async (_fields: string[]) => {
        // no-op
      },
      filterInputData: async <T extends Record<string, unknown>>(
        inputData: T
      ) => ({
        filteredData: inputData,
        removedFields: [] as string[],
      }),
      filterOutputDataArray: async (
        outputDataArray: Record<string, unknown>[]
      ) => outputDataArray,
    },
    hasGlobalAccessForScope: async (
      scope: keyof typeof SCOPES,
      permission: keyof typeof PERMISSIONS
    ): Promise<boolean> => {
      if (!session?.user?.id) return false
      return await hasGlobalAccessForScope(session.user.id, scope, permission)
    },
    /** Prefer admin id for RBAC; used for logging when only customer is logged in */
    effectiveUserId: auditUserId,
    audit,
    SCOPES,
    PERMISSIONS,
  }
})

export type Context = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<Context>().create({ transformer: superjson })

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */

export const createCallerFactory = t.createCallerFactory
export const router = t.router
export const publicProcedure = t.procedure.use(
  async ({ path, type, next, ctx, getRawInput }) => {
    const start = Date.now()

    const [result, input] = await Promise.all([next(), getRawInput()])

    const durationMs = Date.now() - start

    const mutationTimingThreshold = Number(
      process.env.TRPC_MUTATION_TIMING_THRESHOLD_MS ?? '0'
    )
    if (
      type === 'mutation' &&
      Number.isFinite(mutationTimingThreshold) &&
      mutationTimingThreshold > 0 &&
      durationMs >= mutationTimingThreshold
    ) {
      trpcLogger.info(
        {
          path,
          durationMs,
          userId: ctx.session?.user.id ?? null,
        },
        'tRPC mutation timing'
      )
    }

    // Log tRPC request
    const logData = {
      path,
      type,
      durationMs,
      userId: ctx.session?.user.id ?? null,
      input,
    }

    if (durationMs > 1000) {
      trpcLogger.warn(logData, `Slow tRPC request: ${path}`)
    } else {
      trpcLogger.info(logData, `tRPC request: ${path}`)
    }

    // Log errors
    if (result.ok === false) {
      trpcLogger.error(
        { ...logData, error: result.error },
        `tRPC error: ${path}`
      )
    }

    return result
  }
)

/**
 * Protected procedure that validates session and provides authenticated user context.
 */
export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    })
  }
  return next({
    ctx: {
      ...ctx,
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

/**
 * Legacy name: column-level access is removed; this delegates to {@link rbacProcedure}.
 * Third argument kept for call-site compatibility (ignored).
 */
export const rbacWithColumnAccessProcedure = (
  scope: keyof typeof SCOPES,
  permission: keyof typeof PERMISSIONS,
  _availableColumns?: string[]
) => rbacProcedure(scope, permission)

/**
 * Simple RBAC procedure that only checks permissions without column access control
 * Useful for simpler CRUD operations where column filtering is not needed
 */
export const rbacProcedure = (
  scope: keyof typeof SCOPES,
  permission: keyof typeof PERMISSIONS
) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const hasPermission = await can(ctx.session.user.id, scope, permission)

    if (!hasPermission) {
      throw new Error(
        `Bu işlem için ${scope} kapsamında ${permission} izni gerekiyor`
      )
    }

    const rbacHelper = rbac(ctx.session.user.id, scope, permission)
    const hasGlobalAccess = await rbacHelper.hasGlobalAccess()

    return next({
      ctx: {
        ...ctx,
        rbac: {
          hasGlobalAccess,
        },
      },
    })
  })

export type { RouterInputs, RouterOutputs } from './types'

export const columnFiltersSchema = z.record(z.string(), z.string()).optional()

export const createPaginationSchema = <
  const T extends readonly [string, ...string[]],
>(
  sortBy: T
) =>
  z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(10000).default(10), // Increased max to 10000 to support fetching all records
    search: z.string().optional(),
    sortBy: z.enum(sortBy).default(sortBy[0]),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })

export const createAdminListSchema = <
  const T extends readonly [string, ...string[]],
>(
  sortBy: T
) =>
  createPaginationSchema(sortBy).extend({
    columnFilters: columnFiltersSchema,
  })
