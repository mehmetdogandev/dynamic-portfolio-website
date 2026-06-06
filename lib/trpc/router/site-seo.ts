import { router, rbacProcedure, publicProcedure } from '../index'
import { file, siteSeo, SCOPES, PERMISSIONS } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod/v4'
import { TRPCError } from '@trpc/server'

const uuidZ = z.uuid()

const sameAsZ = z.array(z.string().url()).default([])

const siteSeoUpdateInput = z.object({
  defaultMetaDescription: z.string().optional().nullable(),
  defaultOgImageFileId: z.union([uuidZ, z.null()]).optional(),
  organizationName: z.string().optional().nullable(),
  sameAs: sameAsZ.optional(),
  twitterSite: z.string().optional().nullable(),
  googleSiteVerification: z.string().optional().nullable(),
})

export const siteSeoRouter = router({
  getPublic: publicProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db.select().from(siteSeo).limit(1)
    if (!row) return null
    let defaultOgImageViewUrl: string | null = null
    if (row.defaultOgImageFileId) {
      const [f] = await ctx.db
        .select({ id: file.id })
        .from(file)
        .where(eq(file.id, row.defaultOgImageFileId))
        .limit(1)
      if (f) defaultOgImageViewUrl = `/api/files/${f.id}/view`
    }
    const sameAs = Array.isArray(row.sameAsJson)
      ? row.sameAsJson.filter((u): u is string => typeof u === 'string')
      : []
    return {
      defaultMetaDescription: row.defaultMetaDescription,
      defaultOgImageViewUrl,
      organizationName: row.organizationName,
      sameAs,
      twitterSite: row.twitterSite,
      googleSiteVerification: row.googleSiteVerification,
    }
  }),

  get: rbacProcedure(SCOPES.SITE_SEO, PERMISSIONS.READ).query(
    async ({ ctx }) => {
      const [row] = await ctx.db.select().from(siteSeo).limit(1)
      if (!row) {
        return {
          id: null as string | null,
          defaultMetaDescription: null as string | null,
          defaultOgImageFileId: null as string | null,
          organizationName: null as string | null,
          sameAs: [] as string[],
          twitterSite: null as string | null,
          googleSiteVerification: null as string | null,
        }
      }
      return {
        id: row.id,
        defaultMetaDescription: row.defaultMetaDescription,
        defaultOgImageFileId: row.defaultOgImageFileId,
        organizationName: row.organizationName,
        sameAs: Array.isArray(row.sameAsJson)
          ? row.sameAsJson.filter((u): u is string => typeof u === 'string')
          : [],
        twitterSite: row.twitterSite,
        googleSiteVerification: row.googleSiteVerification,
      }
    }
  ),

  upsert: rbacProcedure(SCOPES.SITE_SEO, PERMISSIONS.UPDATE)
    .input(siteSeoUpdateInput)
    .mutation(async ({ ctx, input }) => {
      if (input.defaultOgImageFileId) {
        const [f] = await ctx.db
          .select({ id: file.id })
          .from(file)
          .where(eq(file.id, input.defaultOgImageFileId))
          .limit(1)
        if (!f) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'OG görsel dosyası bulunamadı',
          })
        }
      }

      const [existing] = await ctx.db
        .select({ id: siteSeo.id })
        .from(siteSeo)
        .limit(1)

      const sameAsList = input.sameAs ?? []
      const payload = {
        defaultMetaDescription: input.defaultMetaDescription ?? null,
        defaultOgImageFileId: input.defaultOgImageFileId ?? null,
        organizationName: input.organizationName ?? null,
        sameAsJson: sameAsList,
        twitterSite: input.twitterSite ?? null,
        googleSiteVerification: input.googleSiteVerification ?? null,
      }

      if (existing) {
        await ctx.db
          .update(siteSeo)
          .set(payload)
          .where(eq(siteSeo.id, existing.id))
        return { id: existing.id }
      }

      const [inserted] = await ctx.db
        .insert(siteSeo)
        .values(payload)
        .returning({ id: siteSeo.id })

      return { id: inserted?.id ?? null }
    }),
})
