import { and, asc, count, desc, eq } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { file } from '@/lib/db/schema'
import { radioMobileBuild } from '@/lib/db/schema/radio-mobile'
import {
  applyColumnFilters,
  createMultiColumnSearch,
  excludeDeleted,
} from '@/lib/db/utils'
import { paginatedListResponse } from '../../../admin-list'
import type { RadioMobileChannelValue } from '@/lib/radio-mobile/channels'

export const buildRowSelect = {
  id: radioMobileBuild.id,
  channel: radioMobileBuild.channel,
  versionMajor: radioMobileBuild.versionMajor,
  versionPatch: radioMobileBuild.versionPatch,
  versionName: radioMobileBuild.versionName,
  versionCode: radioMobileBuild.versionCode,
  displayName: radioMobileBuild.displayName,
  fileId: radioMobileBuild.fileId,
  sizeBytes: radioMobileBuild.sizeBytes,
  isPublished: radioMobileBuild.isPublished,
  isStable: radioMobileBuild.isStable,
  isPublicOnSite: radioMobileBuild.isPublicOnSite,
  reactNativeVersion: radioMobileBuild.reactNativeVersion,
  minSdk: radioMobileBuild.minSdk,
  targetSdk: radioMobileBuild.targetSdk,
  buildToolchain: radioMobileBuild.buildToolchain,
  notes: radioMobileBuild.notes,
  publishedAt: radioMobileBuild.publishedAt,
  createdAt: radioMobileBuild.createdAt,
  updatedAt: radioMobileBuild.updatedAt,
  deletedAt: radioMobileBuild.deletedAt,
  fileUrl: file.url,
  fileName: file.fileName,
  bucket: file.bucket,
} as const

export async function listBuildsForChannel(
  ctx: { db: { select: typeof import('@/lib/db').db.select } },
  input: {
    page: number
    limit: number
    search?: string
    sortBy?: string
    sortOrder: 'asc' | 'desc'
    columnFilters?: Record<string, string>
    includeDeleted?: boolean
  },
  channel: RadioMobileChannelValue
) {
  const {
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    columnFilters,
    includeDeleted,
  } = input
  const offset = (page - 1) * limit
  const conditions: SQL[] = [eq(radioMobileBuild.channel, channel)]
  if (!includeDeleted) {
    conditions.push(excludeDeleted(radioMobileBuild))
  }
  if (search) {
    conditions.push(
      createMultiColumnSearch(
        [
          radioMobileBuild.versionName,
          radioMobileBuild.displayName,
          radioMobileBuild.notes,
        ],
        search
      )
    )
  }
  applyColumnFilters(conditions, columnFilters, {
    versionName: radioMobileBuild.versionName,
    displayName: radioMobileBuild.displayName,
    publishedAt: radioMobileBuild.publishedAt,
    createdAt: radioMobileBuild.createdAt,
  })
  const whereCondition = and(...conditions)
  const orderFn = sortOrder === 'asc' ? asc : desc
  const sortColumn =
    sortBy === 'versionName'
      ? radioMobileBuild.versionName
      : sortBy === 'displayName'
        ? radioMobileBuild.displayName
        : sortBy === 'publishedAt'
          ? radioMobileBuild.publishedAt
          : sortBy === 'createdAt'
            ? radioMobileBuild.createdAt
            : radioMobileBuild.versionCode

  const [rows, totalResult] = await Promise.all([
    ctx.db
      .select(buildRowSelect)
      .from(radioMobileBuild)
      .leftJoin(file, eq(radioMobileBuild.fileId, file.id))
      .where(whereCondition)
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset),
    ctx.db
      .select({ count: count() })
      .from(radioMobileBuild)
      .where(whereCondition),
  ])
  return paginatedListResponse(rows, totalResult[0]?.count ?? 0, page, limit)
}
