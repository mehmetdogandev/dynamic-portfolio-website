import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod/v4'
import { headerSettings, PERMISSIONS, SCOPES } from '@/lib/db/schema'
import { publicProcedure, rbacProcedure, router } from '../index'

const headerSettingsUpsertInput = z.object({
  stickyHeaderEnabled: z.boolean().optional(),
  scrollProgressBarEnabled: z.boolean().optional(),
})

function mapHeaderSettingsRow(row: {
  stickyHeaderEnabled: boolean
  scrollProgressBarEnabled: boolean
}) {
  return {
    stickyHeaderEnabled: row.stickyHeaderEnabled,
    scrollProgressBarEnabled: row.scrollProgressBarEnabled,
  }
}

const defaultSettings = {
  id: null as string | null,
  stickyHeaderEnabled: false,
  scrollProgressBarEnabled: false,
}

export const headerSettingsRouter = router({
  getPublic: publicProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db.select().from(headerSettings).limit(1)
    if (!row) {
      return {
        stickyHeaderEnabled: false,
        scrollProgressBarEnabled: false,
      }
    }
    return mapHeaderSettingsRow(row)
  }),

  get: rbacProcedure(SCOPES.HEADER_NAV, PERMISSIONS.READ).query(
    async ({ ctx }) => {
      const [row] = await ctx.db.select().from(headerSettings).limit(1)
      if (!row) return defaultSettings
      return {
        id: row.id,
        ...mapHeaderSettingsRow(row),
      }
    }
  ),

  upsert: rbacProcedure(SCOPES.HEADER_NAV, PERMISSIONS.UPDATE)
    .input(headerSettingsUpsertInput)
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({
          id: headerSettings.id,
          stickyHeaderEnabled: headerSettings.stickyHeaderEnabled,
          scrollProgressBarEnabled: headerSettings.scrollProgressBarEnabled,
        })
        .from(headerSettings)
        .limit(1)

      let sticky = existing?.stickyHeaderEnabled ?? false
      let progress = existing?.scrollProgressBarEnabled ?? false

      if (input.stickyHeaderEnabled !== undefined) {
        sticky = input.stickyHeaderEnabled
      }
      if (input.scrollProgressBarEnabled !== undefined) {
        progress = input.scrollProgressBarEnabled
      }

      if (progress && !sticky) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Scroll progress bar için sabit header açık olmalıdır.',
        })
      }

      if (!sticky) {
        progress = false
      }

      const payload = {
        stickyHeaderEnabled: sticky,
        scrollProgressBarEnabled: progress,
      }

      if (existing) {
        await ctx.db
          .update(headerSettings)
          .set(payload)
          .where(eq(headerSettings.id, existing.id))
        return { id: existing.id, ...payload }
      }

      const [inserted] = await ctx.db
        .insert(headerSettings)
        .values(payload)
        .returning({ id: headerSettings.id })

      return { id: inserted?.id ?? null, ...payload }
    }),
})
