/**
 * User Favorites Router
 *
 * Provides endpoints for managing user favorite items
 */

import { router, protectedProcedure } from '../index'
import { z } from 'zod'
import { userFavoriteItems } from '@/lib/db/schema'
import { TRPCError } from '@trpc/server'
import { eq, and } from 'drizzle-orm'

export const userFavoritesRouter = router({
  /**
   * List all user favorite items (soft delete aware)
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const favorites = await ctx.db
      .select()
      .from(userFavoriteItems)
      .where(
        and(
          eq(userFavoriteItems.userId, ctx.session.user.id),
          eq(userFavoriteItems.isDeleted, false)
        )
      )
      .orderBy(userFavoriteItems.createdAt)

    return favorites
  }),

  /**
   * Get only hrefs (for backward compatibility with frontend)
   */
  getHrefs: protectedProcedure.query(async ({ ctx }) => {
    try {
      const favorites = await ctx.db
        .select({ href: userFavoriteItems.href })
        .from(userFavoriteItems)
        .where(
          and(
            eq(userFavoriteItems.userId, ctx.session.user.id),
            eq(userFavoriteItems.isDeleted, false)
          )
        )

      return favorites.map((f) => f.href)
    } catch (err) {
      // Log the error on the server and return an empty array so frontend can fallback to localStorage
      console.error('userFavorites.getHrefs DB error:', err)
      return [] as string[]
    }
  }),

  /**
   * Create a new favorite item
   */
  create: protectedProcedure
    .input(
      z.object({
        href: z.string().min(1, 'Href is required'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if already exists (even if soft deleted)
      const existing = await ctx.db
        .select()
        .from(userFavoriteItems)
        .where(
          and(
            eq(userFavoriteItems.userId, ctx.session.user.id),
            eq(userFavoriteItems.href, input.href)
          )
        )
        .limit(1)

      // If exists and deleted, restore it
      if (existing.length > 0) {
        if (existing[0].isDeleted) {
          const restored = await ctx.db
            .update(userFavoriteItems)
            .set({
              isDeleted: false,
              deletedAt: null,
              updatedAt: new Date(),
            })
            .where(eq(userFavoriteItems.id, existing[0].id))
            .returning()

          return restored[0]
        } else {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'This item is already in your favorites',
          })
        }
      }

      // Create new favorite
      const newFavorite = await ctx.db
        .insert(userFavoriteItems)
        .values({
          userId: ctx.session.user.id,
          href: input.href,
        })
        .returning()

      return newFavorite[0]
    }),

  /**
   * Soft delete a favorite item
   */
  delete: protectedProcedure
    .input(
      z.object({
        href: z.string().min(1, 'Href is required'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db
        .update(userFavoriteItems)
        .set({
          isDeleted: true,
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userFavoriteItems.userId, ctx.session.user.id),
            eq(userFavoriteItems.href, input.href),
            eq(userFavoriteItems.isDeleted, false)
          )
        )
        .returning()

      if (deleted.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Favorite item not found',
        })
      }

      return deleted[0]
    }),

  /**
   * Hard delete a favorite item (optional - for cleanup)
   */
  hardDelete: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid('Invalid ID format'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db
        .delete(userFavoriteItems)
        .where(
          and(
            eq(userFavoriteItems.userId, ctx.session.user.id),
            eq(userFavoriteItems.id, input.id)
          )
        )
        .returning()

      if (deleted.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Favorite item not found',
        })
      }

      return deleted[0]
    }),

  /**
   * Sync favorites from localStorage to database (migration helper)
   */
  sync: protectedProcedure
    .input(
      z.object({
        hrefs: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Soft delete all existing favorites
      await ctx.db
        .update(userFavoriteItems)
        .set({
          isDeleted: true,
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userFavoriteItems.userId, ctx.session.user.id),
            eq(userFavoriteItems.isDeleted, false)
          )
        )

      // Insert new favorites
      if (input.hrefs.length > 0) {
        const values = input.hrefs.map((href) => ({
          userId: ctx.session.user.id,
          href,
        }))

        await ctx.db.insert(userFavoriteItems).values(values)
      }

      return { success: true, count: input.hrefs.length }
    }),

  /**
   * Toggle favorite (add if not exists, remove if exists)
   */
  toggle: protectedProcedure
    .input(
      z.object({
        href: z.string().min(1, 'Href is required'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select()
        .from(userFavoriteItems)
        .where(
          and(
            eq(userFavoriteItems.userId, ctx.session.user.id),
            eq(userFavoriteItems.href, input.href),
            eq(userFavoriteItems.isDeleted, false)
          )
        )
        .limit(1)

      if (existing.length > 0) {
        // Remove (soft delete)
        await ctx.db
          .update(userFavoriteItems)
          .set({
            isDeleted: true,
            deletedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(userFavoriteItems.id, existing[0].id))

        return { action: 'removed', href: input.href }
      } else {
        // Add (or restore if soft deleted)
        const softDeleted = await ctx.db
          .select()
          .from(userFavoriteItems)
          .where(
            and(
              eq(userFavoriteItems.userId, ctx.session.user.id),
              eq(userFavoriteItems.href, input.href),
              eq(userFavoriteItems.isDeleted, true)
            )
          )
          .limit(1)

        if (softDeleted.length > 0) {
          // Restore
          await ctx.db
            .update(userFavoriteItems)
            .set({
              isDeleted: false,
              deletedAt: null,
              updatedAt: new Date(),
            })
            .where(eq(userFavoriteItems.id, softDeleted[0].id))
        } else {
          // Create new
          await ctx.db.insert(userFavoriteItems).values({
            userId: ctx.session.user.id,
            href: input.href,
          })
        }

        return { action: 'added', href: input.href }
      }
    }),
})
