import { z } from "zod";
import { eq, sql, count, asc, desc, and, ilike, or } from "drizzle-orm";
import {
  createTRPCRouter,
  createPermissionProcedure,
} from "@/lib/trpc/trpc";
import { user as userTable } from "@/lib/db/schemas";
import { listInputSchema, type ListOutput } from "@/lib/trpc/list-schema";

const ALLOWED_SORT_COLUMNS = ["name", "email", "createdAt"] as const;
const ALLOWED_FILTER_COLUMNS = ["name", "email"] as const;

export const userRouter = createTRPCRouter({
  list: createPermissionProcedure("USERS", "READ")
    .input(listInputSchema)
    .query(async ({ ctx, input }): Promise<ListOutput<typeof userTable.$inferSelect>> => {
      const { page, limit, sortBy, sortOrder, columnFilters } = input;
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [];
      if (columnFilters) {
        for (const [key, value] of Object.entries(columnFilters)) {
          if (ALLOWED_FILTER_COLUMNS.includes(key as typeof ALLOWED_FILTER_COLUMNS[number]) && value.trim()) {
            if (key === "name") {
              conditions.push(ilike(userTable.name, `%${value}%`));
            } else if (key === "email") {
              conditions.push(ilike(userTable.email, `%${value}%`));
            }
          }
        }
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const totalResult = await ctx.db
        .select({ count: count() })
        .from(userTable)
        .where(whereClause);
      const total = totalResult[0]?.count ?? 0;
      const totalPages = Math.ceil(total / limit);

      // Build order by
      let orderByClause;
      if (sortBy && ALLOWED_SORT_COLUMNS.includes(sortBy as typeof ALLOWED_SORT_COLUMNS[number])) {
        if (sortBy === "name") {
          orderByClause = sortOrder === "desc" ? desc(userTable.name) : asc(userTable.name);
        } else if (sortBy === "email") {
          orderByClause = sortOrder === "desc" ? desc(userTable.email) : asc(userTable.email);
        } else if (sortBy === "createdAt") {
          orderByClause = sortOrder === "desc" ? desc(userTable.createdAt) : asc(userTable.createdAt);
        }
      }
      // Default order by createdAt desc if no sort specified
      if (!orderByClause) {
        orderByClause = desc(userTable.createdAt);
      }

      // Get paginated items
      const items = await ctx.db
        .select()
        .from(userTable)
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

  getById: createPermissionProcedure("USERS", "READ")
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(userTable)
        .where(eq(userTable.id, input.id))
        .limit(1);
      return rows[0] ?? null;
    }),

  create: createPermissionProcedure("USERS", "CREATE")
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Better Auth manages user creation; use auth.api or server action for full signup.
      // For now we only allow listing/update/delete via tRPC; create can be done via auth signUp or admin API.
      const id = crypto.randomUUID();
      await ctx.db.insert(userTable).values({
        id,
        name: input.name,
        email: input.email,
        emailVerified: false,
      });
      return { id };
    }),

  update: createPermissionProcedure("USERS", "UPDATE")
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      await ctx.db
        .update(userTable)
        .set({ ...rest, updatedAt: new Date() })
        .where(eq(userTable.id, id));
      return { id };
    }),

  delete: createPermissionProcedure("USERS", "DELETE")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(userTable).where(eq(userTable.id, input.id));
      return { id: input.id };
    }),
});
