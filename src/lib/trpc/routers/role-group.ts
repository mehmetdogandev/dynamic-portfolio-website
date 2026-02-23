import { z } from "zod";
import { eq, count, asc, desc, and, ilike } from "drizzle-orm";
import {
  createTRPCRouter,
  createPermissionProcedure,
} from "@/lib/trpc/trpc";
import { roleGroupTable, roleGroupRoleTable } from "@/lib/db/schemas";
import { listInputSchema, type ListOutput } from "@/lib/trpc/list-schema";

const ALLOWED_SORT_COLUMNS = ["name", "description", "createdAt"] as const;
const ALLOWED_FILTER_COLUMNS = ["name", "description"] as const;

export const roleGroupRouter = createTRPCRouter({
  list: createPermissionProcedure("ROLE_GROUPS", "READ")
    .input(listInputSchema)
    .query(async ({ ctx, input }): Promise<ListOutput<typeof roleGroupTable.$inferSelect>> => {
      const { page, limit, sortBy, sortOrder, columnFilters } = input;
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [];
      if (columnFilters) {
        for (const [key, value] of Object.entries(columnFilters)) {
          if (ALLOWED_FILTER_COLUMNS.includes(key as typeof ALLOWED_FILTER_COLUMNS[number]) && value.trim()) {
            if (key === "name") {
              conditions.push(ilike(roleGroupTable.name, `%${value}%`));
            } else if (key === "description") {
              conditions.push(ilike(roleGroupTable.description, `%${value}%`));
            }
          }
        }
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const totalResult = await ctx.db
        .select({ count: count() })
        .from(roleGroupTable)
        .where(whereClause);
      const total = totalResult[0]?.count ?? 0;
      const totalPages = Math.ceil(total / limit);

      // Build order by
      let orderByClause;
      if (sortBy && ALLOWED_SORT_COLUMNS.includes(sortBy as typeof ALLOWED_SORT_COLUMNS[number])) {
        if (sortBy === "name") {
          orderByClause = sortOrder === "desc" ? desc(roleGroupTable.name) : asc(roleGroupTable.name);
        } else if (sortBy === "description") {
          orderByClause = sortOrder === "desc" ? desc(roleGroupTable.description) : asc(roleGroupTable.description);
        } else if (sortBy === "createdAt") {
          orderByClause = sortOrder === "desc" ? desc(roleGroupTable.createdAt) : asc(roleGroupTable.createdAt);
        }
      }
      // Default order by createdAt desc if no sort specified
      orderByClause ??= desc(roleGroupTable.createdAt);

      // Get paginated items
      const items = await ctx.db
        .select()
        .from(roleGroupTable)
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

  getById: createPermissionProcedure("ROLE_GROUPS", "READ")
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(roleGroupTable)
        .where(eq(roleGroupTable.id, input.id))
        .limit(1);
      const group = rows[0] ?? null;
      if (!group) return null;
      const links = await ctx.db
        .select({ roleId: roleGroupRoleTable.roleId })
        .from(roleGroupRoleTable)
        .where(eq(roleGroupRoleTable.roleGroupId, input.id));
      return { ...group, roleIds: links.map((l) => l.roleId) };
    }),

  create: createPermissionProcedure("ROLE_GROUPS", "CREATE")
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        roleIds: z.array(z.string().uuid()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(roleGroupTable)
        .values({
          name: input.name,
          description: input.description,
        })
        .returning({ id: roleGroupTable.id });
      if (!row) throw new Error("Failed to create role group");
      for (const roleId of input.roleIds) {
        await ctx.db.insert(roleGroupRoleTable).values({
          roleGroupId: row.id,
          roleId,
        });
      }
      return { id: row.id };
    }),

  update: createPermissionProcedure("ROLE_GROUPS", "UPDATE")
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        roleIds: z.array(z.string().uuid()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, description, roleIds } = input;
      if (name !== undefined || description !== undefined) {
        await ctx.db
          .update(roleGroupTable)
          .set({
            ...(name !== undefined && { name }),
            ...(description !== undefined && { description }),
            updatedAt: new Date(),
          })
          .where(eq(roleGroupTable.id, id));
      }
      if (roleIds !== undefined) {
        await ctx.db.delete(roleGroupRoleTable).where(eq(roleGroupRoleTable.roleGroupId, id));
        for (const roleId of roleIds) {
          await ctx.db.insert(roleGroupRoleTable).values({ roleGroupId: id, roleId });
        }
      }
      return { id };
    }),

  delete: createPermissionProcedure("ROLE_GROUPS", "DELETE")
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(roleGroupTable).where(eq(roleGroupTable.id, input.id));
      return { id: input.id };
    }),
});
