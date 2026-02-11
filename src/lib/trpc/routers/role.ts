import { z } from "zod";
import { eq, sql, count, asc, desc, and, ilike, or } from "drizzle-orm";
import {
  createTRPCRouter,
  createPermissionProcedure,
} from "@/lib/trpc/trpc";
import type { Permission } from "@/lib/rbac/permissions";
import { roleTable } from "@/lib/db/schemas";
import { listInputSchema, type ListOutput } from "@/lib/trpc/list-schema";

const pageSchema = z.enum([
  "HOME_PAGE",
  "USERS",
  "ROLES",
  "ROLE_GROUPS",
  "USER_ROLES",
  "USER_ROLE_GROUPS",
  "LOGO",
  "POST",
]);
const permissionSchema = z.enum(["CREATE", "DELETE", "UPDATE", "ACCESS", "READ"]);

const ALLOWED_SORT_COLUMNS = ["name", "description", "page", "createdAt"] as const;
const ALLOWED_FILTER_COLUMNS = ["name", "description", "page"] as const;

export const roleRouter = createTRPCRouter({
  list: createPermissionProcedure("ROLES", "READ")
    .input(listInputSchema)
    .query(async ({ ctx, input }): Promise<ListOutput<typeof roleTable.$inferSelect>> => {
      const { page, limit, sortBy, sortOrder, columnFilters } = input;
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [];
      if (columnFilters) {
        for (const [key, value] of Object.entries(columnFilters)) {
          if (ALLOWED_FILTER_COLUMNS.includes(key as typeof ALLOWED_FILTER_COLUMNS[number]) && value.trim()) {
            if (key === "name") {
              conditions.push(ilike(roleTable.name, `%${value}%`));
            } else if (key === "description") {
              conditions.push(ilike(roleTable.description, `%${value}%`));
            } else if (key === "page") {
              conditions.push(eq(roleTable.page, value as any));
            }
          }
        }
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const totalResult = await ctx.db
        .select({ count: count() })
        .from(roleTable)
        .where(whereClause);
      const total = totalResult[0]?.count ?? 0;
      const totalPages = Math.ceil(total / limit);

      // Build order by
      let orderByClause;
      if (sortBy && ALLOWED_SORT_COLUMNS.includes(sortBy as typeof ALLOWED_SORT_COLUMNS[number])) {
        if (sortBy === "name") {
          orderByClause = sortOrder === "desc" ? desc(roleTable.name) : asc(roleTable.name);
        } else if (sortBy === "description") {
          orderByClause = sortOrder === "desc" ? desc(roleTable.description) : asc(roleTable.description);
        } else if (sortBy === "page") {
          orderByClause = sortOrder === "desc" ? desc(roleTable.page) : asc(roleTable.page);
        } else if (sortBy === "createdAt") {
          orderByClause = sortOrder === "desc" ? desc(roleTable.createdAt) : asc(roleTable.createdAt);
        }
      }
      // Default order by createdAt desc if no sort specified
      if (!orderByClause) {
        orderByClause = desc(roleTable.createdAt);
      }

      // Get paginated items
      const items = await ctx.db
        .select()
        .from(roleTable)
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

  getById: createPermissionProcedure("ROLES", "READ")
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(roleTable)
        .where(eq(roleTable.id, input.id))
        .limit(1);
      return rows[0] ?? null;
    }),

  create: createPermissionProcedure("ROLES", "CREATE")
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        permissions: z.array(permissionSchema),
        page: pageSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(roleTable)
        .values({
          name: input.name,
          description: input.description,
          permissions: input.permissions as Permission[],
          page: input.page,
        })
        .returning({ id: roleTable.id });
      return { id: row!.id };
    }),

  update: createPermissionProcedure("ROLES", "UPDATE")
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        permissions: z.array(permissionSchema).optional(),
        page: pageSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      await ctx.db
        .update(roleTable)
        .set({
          ...(rest.name !== undefined && { name: rest.name }),
          ...(rest.description !== undefined && { description: rest.description }),
          ...(rest.permissions !== undefined && { permissions: rest.permissions as Permission[] }),
          ...(rest.page !== undefined && { page: rest.page }),
          updatedAt: new Date(),
        })
        .where(eq(roleTable.id, id));
      return { id };
    }),

  delete: createPermissionProcedure("ROLES", "DELETE")
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(roleTable).where(eq(roleTable.id, input.id));
      return { id: input.id };
    }),
});
