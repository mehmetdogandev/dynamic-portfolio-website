import { z } from 'zod/v4'
import { TRPCError } from '@trpc/server'
import { and, eq, isNull } from 'drizzle-orm'
import { createAdminListSchema, rbacProcedure, router } from '../../../index'
import { SCOPES, PERMISSIONS, file } from '@/lib/db/schema'
import {
  radioMobileBuild,
  radioMobileChannelConfig,
} from '@/lib/db/schema/radio-mobile'
import { uploadFile, getSignedDownloadUrl } from '@/lib/s3/utils'
import type { RadioMobileChannelValue } from '@/lib/radio-mobile/channels'
import { PUBLIC_PATH_BY_CHANNEL } from '@/lib/radio-mobile/channels'
import { getNextVersionForChannel } from '@/lib/radio-mobile/version'
import { buildRowSelect, listBuildsForChannel } from './build-queries'

const listInputSchema = createAdminListSchema([
  'versionName',
  'displayName',
  'publishedAt',
  'createdAt',
]).extend({
  includeDeleted: z.boolean().optional(),
})

export function createRadioMobileChannelRouter(
  channel: RadioMobileChannelValue,
  scope: keyof typeof SCOPES
) {
  return router({
    list: rbacProcedure(scope, PERMISSIONS.READ)
      .input(listInputSchema)
      .query(async ({ ctx, input }) =>
        listBuildsForChannel(ctx, input, channel)
      ),

    getById: rbacProcedure(scope, PERMISSIONS.READ)
      .input(z.object({ id: z.uuid() }))
      .query(async ({ ctx, input }) => {
        const [row] = await ctx.db
          .select(buildRowSelect)
          .from(radioMobileBuild)
          .leftJoin(file, eq(radioMobileBuild.fileId, file.id))
          .where(
            and(
              eq(radioMobileBuild.id, input.id),
              eq(radioMobileBuild.channel, channel)
            )
          )
          .limit(1)
        if (!row) {
          throw new TRPCError({ code: 'NOT_FOUND' })
        }
        let downloadUrl: string | null = null
        if (row.fileName) {
          downloadUrl = await getSignedDownloadUrl(row.fileName, {
            bucket: row.bucket ?? undefined,
          })
        }
        return { ...row, downloadUrl }
      }),

    create: rbacProcedure(scope, PERMISSIONS.CREATE)
      .input(
        z.object({
          versionMajor: z.number().int().min(0),
          file: z.string(),
          fileName: z.string(),
          mimeType: z
            .string()
            .default('application/vnd.android.package-archive'),
          displayName: z.string().optional(),
          isStable: z.boolean().default(false),
          isPublicOnSite: z.boolean().default(false),
          reactNativeVersion: z.string().optional(),
          minSdk: z.number().int().optional(),
          targetSdk: z.number().int().optional(),
          buildToolchain: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const version = await getNextVersionForChannel(
          channel,
          input.versionMajor
        )
        const buffer = Buffer.from(input.file, 'base64')
        const displayName =
          input.displayName?.trim() ||
          input.fileName ||
          `radio-${version.versionName}-${channel}.apk`
        const prefix = `radio-mobile/${channel}/${version.versionMajor}`
        const uploaded = await uploadFile(buffer, displayName, input.mimeType, {
          prefix,
          isPublic: true,
          uploadedBy: ctx.session.user.id,
        })
        const [build] = await ctx.db
          .insert(radioMobileBuild)
          .values({
            channel,
            versionMajor: version.versionMajor,
            versionPatch: version.versionPatch,
            versionName: version.versionName,
            versionCode: version.versionCode,
            displayName,
            fileId: uploaded.id,
            sizeBytes: buffer.length,
            isPublished: true,
            isStable: input.isStable,
            isPublicOnSite: input.isPublicOnSite,
            reactNativeVersion: input.reactNativeVersion ?? null,
            minSdk: input.minSdk ?? null,
            targetSdk: input.targetSdk ?? null,
            buildToolchain: input.buildToolchain ?? null,
            notes: input.notes ?? null,
            createdBy: ctx.session.user.id,
          })
          .returning()
        return build
      }),

    update: rbacProcedure(scope, PERMISSIONS.UPDATE)
      .input(
        z.object({
          id: z.uuid(),
          displayName: z.string().min(1).optional(),
          notes: z.string().nullable().optional(),
          isStable: z.boolean().optional(),
          isPublicOnSite: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...patch } = input
        const [updated] = await ctx.db
          .update(radioMobileBuild)
          .set({ ...patch, lastUpdatedBy: ctx.session.user.id })
          .where(
            and(
              eq(radioMobileBuild.id, id),
              eq(radioMobileBuild.channel, channel)
            )
          )
          .returning()
        if (!updated) {
          throw new TRPCError({ code: 'NOT_FOUND' })
        }
        return updated
      }),

    delete: rbacProcedure(scope, PERMISSIONS.DELETE)
      .input(z.object({ id: z.uuid() }))
      .mutation(async ({ ctx, input }) => {
        const [updated] = await ctx.db
          .update(radioMobileBuild)
          .set({ deletedAt: new Date(), deletedBy: ctx.session.user.id })
          .where(
            and(
              eq(radioMobileBuild.id, input.id),
              eq(radioMobileBuild.channel, channel),
              isNull(radioMobileBuild.deletedAt)
            )
          )
          .returning()
        if (!updated) {
          throw new TRPCError({ code: 'NOT_FOUND' })
        }
        return { ok: true }
      }),

    getChannelConfig: rbacProcedure(scope, PERMISSIONS.READ).query(
      async ({ ctx }) => {
        const [row] = await ctx.db
          .select()
          .from(radioMobileChannelConfig)
          .where(eq(radioMobileChannelConfig.channel, channel))
          .limit(1)
        if (row) return row
        return {
          channel,
          isPublicPage: false,
          publicUrlPath: PUBLIC_PATH_BY_CHANNEL[channel],
        }
      }
    ),

    updateChannelConfig: rbacProcedure(scope, PERMISSIONS.UPDATE)
      .input(z.object({ isPublicPage: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const path = PUBLIC_PATH_BY_CHANNEL[channel]
        const [existing] = await ctx.db
          .select({ channel: radioMobileChannelConfig.channel })
          .from(radioMobileChannelConfig)
          .where(eq(radioMobileChannelConfig.channel, channel))
          .limit(1)

        if (existing) {
          const [updated] = await ctx.db
            .update(radioMobileChannelConfig)
            .set({
              isPublicPage: input.isPublicPage,
              lastUpdatedBy: ctx.session.user.id,
            })
            .where(eq(radioMobileChannelConfig.channel, channel))
            .returning()
          return updated
        }

        const [inserted] = await ctx.db
          .insert(radioMobileChannelConfig)
          .values({
            channel,
            isPublicPage: input.isPublicPage,
            publicUrlPath: path,
            createdBy: ctx.session.user.id,
          })
          .returning()
        return inserted
      }),
  })
}
