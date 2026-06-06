import { z } from 'zod/v4'
import { TRPCError } from '@trpc/server'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { rbacProcedure, router } from '../../index'
import { SCOPES, PERMISSIONS } from '@/lib/db/schema'
import { radioMobileApiKey } from '@/lib/db/schema/radio-mobile'
import {
  generateApiKeyPlain,
  hashApiKey,
} from '@/lib/radio-mobile/api-key-auth'

export const radioMobileApiKeyRouter = router({
  list: rbacProcedure(SCOPES.RADIO_MOBILE_API_KEY, PERMISSIONS.READ).query(
    async ({ ctx }) => {
      return ctx.db
        .select({
          id: radioMobileApiKey.id,
          name: radioMobileApiKey.name,
          keyPrefix: radioMobileApiKey.keyPrefix,
          canAndroidRelease: radioMobileApiKey.canAndroidRelease,
          canAndroidDebug: radioMobileApiKey.canAndroidDebug,
          canIosRelease: radioMobileApiKey.canIosRelease,
          canIosDebug: radioMobileApiKey.canIosDebug,
          expiresAt: radioMobileApiKey.expiresAt,
          lastUsedAt: radioMobileApiKey.lastUsedAt,
          createdAt: radioMobileApiKey.createdAt,
        })
        .from(radioMobileApiKey)
        .where(isNull(radioMobileApiKey.deletedAt))
        .orderBy(desc(radioMobileApiKey.createdAt))
    }
  ),

  create: rbacProcedure(SCOPES.RADIO_MOBILE_API_KEY, PERMISSIONS.CREATE)
    .input(
      z.object({
        name: z.string().min(1),
        canAndroidRelease: z.boolean().default(false),
        canAndroidDebug: z.boolean().default(false),
        canIosRelease: z.boolean().default(false),
        canIosDebug: z.boolean().default(false),
        expiresAt: z.date().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const plain = generateApiKeyPlain()
      const hash = hashApiKey(plain)
      const prefix = plain.slice(-4)
      const [row] = await ctx.db
        .insert(radioMobileApiKey)
        .values({
          name: input.name,
          keyHash: hash,
          keyPrefix: prefix,
          canAndroidRelease: input.canAndroidRelease,
          canAndroidDebug: input.canAndroidDebug,
          canIosRelease: input.canIosRelease,
          canIosDebug: input.canIosDebug,
          expiresAt: input.expiresAt ?? null,
          createdBy: ctx.session.user.id,
        })
        .returning()
      return { ...row, plainKey: plain }
    }),

  delete: rbacProcedure(SCOPES.RADIO_MOBILE_API_KEY, PERMISSIONS.DELETE)
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(radioMobileApiKey)
        .set({
          deletedAt: new Date(),
          deletedBy: ctx.session.user.id,
        })
        .where(
          and(
            eq(radioMobileApiKey.id, input.id),
            isNull(radioMobileApiKey.deletedAt)
          )
        )
        .returning()
      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }
      return { ok: true }
    }),

  update: rbacProcedure(SCOPES.RADIO_MOBILE_API_KEY, PERMISSIONS.UPDATE)
    .input(
      z.object({
        id: z.uuid(),
        name: z.string().min(1).optional(),
        canAndroidRelease: z.boolean().optional(),
        canAndroidDebug: z.boolean().optional(),
        canIosRelease: z.boolean().optional(),
        canIosDebug: z.boolean().optional(),
        expiresAt: z.date().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...patch } = input
      const [updated] = await ctx.db
        .update(radioMobileApiKey)
        .set({ ...patch, lastUpdatedBy: ctx.session.user.id })
        .where(
          and(eq(radioMobileApiKey.id, id), isNull(radioMobileApiKey.deletedAt))
        )
        .returning()
      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }
      return updated
    }),
})
