import { z } from "zod";
import { eq, count, asc, desc, and, ilike } from "drizzle-orm";
import {
  createTRPCRouter,
  createPermissionProcedure,
} from "@/lib/trpc/trpc";
import { logo } from "@/lib/db/schemas";
import { listInputSchema, type ListOutput } from "@/lib/trpc/list-schema";

const logoStatusSchema = z.enum(["ACTIVE", "PASSIVE"]);

const ALLOWED_SORT_COLUMNS = ["name", "path", "status", "createdAt"] as const;
const ALLOWED_FILTER_COLUMNS = ["name", "path", "status"] as const;

export const logoRouter = createTRPCRouter({
  list: createPermissionProcedure("LOGO", "READ")
    .input(listInputSchema)
    .query(async ({ ctx, input }): Promise<ListOutput<typeof logo.$inferSelect>> => {
      const { page, limit, sortBy, sortOrder, columnFilters } = input;
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [];
      if (columnFilters) {
        for (const [key, value] of Object.entries(columnFilters)) {
          if (ALLOWED_FILTER_COLUMNS.includes(key as typeof ALLOWED_FILTER_COLUMNS[number]) && value.trim()) {
            if (key === "name") {
              conditions.push(ilike(logo.name, `%${value}%`));
            } else if (key === "path") {
              conditions.push(ilike(logo.path, `%${value}%`));
            } else if (key === "status") {
              conditions.push(eq(logo.status, value as "ACTIVE" | "PASSIVE"));
            }
          }
        }
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const totalResult = await ctx.db
        .select({ count: count() })
        .from(logo)
        .where(whereClause);
      const total = totalResult[0]?.count ?? 0;
      const totalPages = Math.ceil(total / limit);

      // Build order by
      let orderByClause;
      if (sortBy && ALLOWED_SORT_COLUMNS.includes(sortBy as typeof ALLOWED_SORT_COLUMNS[number])) {
        if (sortBy === "name") {
          orderByClause = sortOrder === "desc" ? desc(logo.name) : asc(logo.name);
        } else if (sortBy === "path") {
          orderByClause = sortOrder === "desc" ? desc(logo.path) : asc(logo.path);
        } else if (sortBy === "status") {
          orderByClause = sortOrder === "desc" ? desc(logo.status) : asc(logo.status);
        } else if (sortBy === "createdAt") {
          orderByClause = sortOrder === "desc" ? desc(logo.createdAt) : asc(logo.createdAt);
        }
      }
      // Default order by createdAt desc if no sort specified
      orderByClause ??= desc(logo.createdAt);

      // Get paginated items
      const items = await ctx.db
        .select()
        .from(logo)
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

  getById: createPermissionProcedure("LOGO", "READ")
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(logo)
        .where(eq(logo.id, input.id))
        .limit(1);
      return rows[0] ?? null;
    }),

  getActive: createPermissionProcedure("LOGO", "READ").query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(logo)
      .where(eq(logo.status, "ACTIVE"))
      .limit(1);
    return rows[0] ?? null;
  }),

  create: createPermissionProcedure("LOGO", "CREATE")
    .input(
      z.object({
        name: z.string().min(1),
        path: z.string().min(1),
        status: logoStatusSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(logo)
        .values({
          name: input.name,
          path: input.path,
          status: input.status ?? "ACTIVE",
        })
        .returning({ id: logo.id });
      return { id: row!.id };
    }),

  update: createPermissionProcedure("LOGO", "UPDATE")
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        path: z.string().min(1).optional(),
        status: logoStatusSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      await ctx.db
        .update(logo)
        .set({ ...rest, updatedAt: new Date() })
        .where(eq(logo.id, id));
      return { id };
    }),

  delete: createPermissionProcedure("LOGO", "DELETE")
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(logo).where(eq(logo.id, input.id));
      return { id: input.id };
    }),

  setActive: createPermissionProcedure("LOGO", "UPDATE")
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // eslint-disable-next-line drizzle/enforce-update-with-where
      await ctx.db
        .update(logo)
        .set({ status: "PASSIVE", updatedAt: new Date() });
      await ctx.db
        .update(logo)
        .set({ status: "ACTIVE", updatedAt: new Date() })
        .where(eq(logo.id, input.id));
      return { id: input.id };
    }),
});
