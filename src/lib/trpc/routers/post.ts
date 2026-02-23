import { z } from "zod";
import { eq, count, asc, desc, and, ilike } from "drizzle-orm";
import {
  createTRPCRouter,
  createPermissionProcedure,
} from "@/lib/trpc/trpc";
import { post } from "@/lib/db/schemas";
import { listInputSchema, type ListOutput } from "@/lib/trpc/list-schema";

const ALLOWED_SORT_COLUMNS = ["name", "userId", "createdAt"] as const;
const ALLOWED_FILTER_COLUMNS = ["name", "userId"] as const;

export const postRouter = createTRPCRouter({
  list: createPermissionProcedure("POST", "READ")
    .input(listInputSchema)
    .query(async ({ ctx, input }): Promise<ListOutput<typeof post.$inferSelect>> => {
      const { page, limit, sortBy, sortOrder, columnFilters } = input;
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [];
      if (columnFilters) {
        for (const [key, value] of Object.entries(columnFilters)) {
          if (ALLOWED_FILTER_COLUMNS.includes(key as typeof ALLOWED_FILTER_COLUMNS[number]) && value.trim()) {
            if (key === "name") {
              conditions.push(ilike(post.name, `%${value}%`));
            } else if (key === "userId") {
              conditions.push(eq(post.userId, value));
            }
          }
        }
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const totalResult = await ctx.db
        .select({ count: count() })
        .from(post)
        .where(whereClause);
      const total = totalResult[0]?.count ?? 0;
      const totalPages = Math.ceil(total / limit);

      // Build order by
      let orderByClause;
      if (sortBy && ALLOWED_SORT_COLUMNS.includes(sortBy as typeof ALLOWED_SORT_COLUMNS[number])) {
        if (sortBy === "name") {
          orderByClause = sortOrder === "desc" ? desc(post.name) : asc(post.name);
        } else if (sortBy === "userId") {
          orderByClause = sortOrder === "desc" ? desc(post.userId) : asc(post.userId);
        } else if (sortBy === "createdAt") {
          orderByClause = sortOrder === "desc" ? desc(post.createdAt) : asc(post.createdAt);
        }
      }
      // Default order by createdAt desc if no sort specified
      orderByClause ??= desc(post.createdAt);

      // Get paginated items
      const items = await ctx.db
        .select()
        .from(post)
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);

      return {
        items,
        total,
        totalPages,
      };
    }),

  getById: createPermissionProcedure("POST", "READ")
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(post)
        .where(eq(post.id, input.id))
        .limit(1);
      return rows[0] ?? null;
    }),

  create: createPermissionProcedure("POST", "CREATE")
    .input(
      z.object({
        name: z.string().min(1),
        content: z.string().min(1),
        imageId: z.string().uuid(),
        categoryId: z.string().uuid(),
        userId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = input.userId ?? ctx.session!.user.id;
      const [row] = await ctx.db
        .insert(post)
        .values({
          name: input.name,
          userId,
          content: input.content,
          imageId: input.imageId,
          categoryId: input.categoryId,
        })
        .returning({ id: post.id });
      return { id: row!.id };
    }),

  update: createPermissionProcedure("POST", "UPDATE")
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      await ctx.db
        .update(post)
        .set({ ...rest, updatedAt: new Date() })
        .where(eq(post.id, id));
      return { id };
    }),

  delete: createPermissionProcedure("POST", "DELETE")
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(post).where(eq(post.id, input.id));
      return { id: input.id };
    }),
});
