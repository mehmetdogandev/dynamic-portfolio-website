import { z } from "zod";
import { eq, count, asc, desc, and, ilike } from "drizzle-orm";
import {
  createTRPCRouter,
  createPermissionProcedure,
} from "@/lib/trpc/trpc";
import { user as userTable, userRoleGroupTable, roleGroupTable } from "@/lib/db/schemas";
import { listInputSchema, type ListOutput } from "@/lib/trpc/list-schema";

const ALLOWED_SORT_COLUMNS = ["userName", "roleGroupName", "createdAt"] as const;
const ALLOWED_FILTER_COLUMNS = ["userName", "roleGroupName"] as const;

type UserRoleGroupListItem = {
  id: string;
  userId: string;
  roleGroupId: string;
  createdAt: Date;
  updatedAt: Date;
  userName: string;
  roleGroupName: string;
};

export const userRoleGroupRouter = createTRPCRouter({
  list: createPermissionProcedure("USER_ROLE_GROUPS", "READ")
    .input(listInputSchema)
    .query(async ({ ctx, input }): Promise<ListOutput<UserRoleGroupListItem>> => {
      const { page, limit, sortBy, sortOrder, columnFilters } = input;
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [];
      if (columnFilters) {
        for (const [key, value] of Object.entries(columnFilters)) {
          if (ALLOWED_FILTER_COLUMNS.includes(key as typeof ALLOWED_FILTER_COLUMNS[number]) && value.trim()) {
            if (key === "userName") {
              conditions.push(ilike(userTable.name, `%${value}%`));
            } else if (key === "roleGroupName") {
              conditions.push(ilike(roleGroupTable.name, `%${value}%`));
            }
          }
        }
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count (with same joins and filters)
      const countQuery = ctx.db
        .select({ count: count() })
        .from(userRoleGroupTable)
        .innerJoin(userTable, eq(userRoleGroupTable.userId, userTable.id))
        .innerJoin(roleGroupTable, eq(userRoleGroupTable.roleGroupId, roleGroupTable.id))
        .where(whereClause);
      const totalResult = await countQuery;
      const total = totalResult[0]?.count ?? 0;
      const totalPages = Math.ceil(total / limit);

      // Build order by
      let orderByClause;
      if (sortBy && ALLOWED_SORT_COLUMNS.includes(sortBy as typeof ALLOWED_SORT_COLUMNS[number])) {
        if (sortBy === "userName") {
          orderByClause = sortOrder === "desc" ? desc(userTable.name) : asc(userTable.name);
        } else if (sortBy === "roleGroupName") {
          orderByClause = sortOrder === "desc" ? desc(roleGroupTable.name) : asc(roleGroupTable.name);
        } else if (sortBy === "createdAt") {
          orderByClause = sortOrder === "desc" ? desc(userRoleGroupTable.createdAt) : asc(userRoleGroupTable.createdAt);
        }
      }
      // Default order by createdAt desc if no sort specified
      if (!orderByClause) {
        orderByClause = desc(userRoleGroupTable.createdAt);
      }

      // Get paginated items
      const items = await ctx.db
        .select({
          id: userRoleGroupTable.id,
          userId: userRoleGroupTable.userId,
          roleGroupId: userRoleGroupTable.roleGroupId,
          createdAt: userRoleGroupTable.createdAt,
          updatedAt: userRoleGroupTable.updatedAt,
          userName: userTable.name,
          roleGroupName: roleGroupTable.name,
        })
        .from(userRoleGroupTable)
        .innerJoin(userTable, eq(userRoleGroupTable.userId, userTable.id))
        .innerJoin(roleGroupTable, eq(userRoleGroupTable.roleGroupId, roleGroupTable.id))
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

  getById: createPermissionProcedure("USER_ROLE_GROUPS", "READ")
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: userRoleGroupTable.id,
          userId: userRoleGroupTable.userId,
          roleGroupId: userRoleGroupTable.roleGroupId,
          createdAt: userRoleGroupTable.createdAt,
          updatedAt: userRoleGroupTable.updatedAt,
          userName: userTable.name,
          roleGroupName: roleGroupTable.name,
        })
        .from(userRoleGroupTable)
        .innerJoin(userTable, eq(userRoleGroupTable.userId, userTable.id))
        .innerJoin(roleGroupTable, eq(userRoleGroupTable.roleGroupId, roleGroupTable.id))
        .where(eq(userRoleGroupTable.id, input.id))
        .limit(1);
      return rows[0] ?? null;
    }),

  getByUserId: createPermissionProcedure("USER_ROLE_GROUPS", "READ")
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(userRoleGroupTable)
        .where(eq(userRoleGroupTable.userId, input.userId));
    }),

  create: createPermissionProcedure("USER_ROLE_GROUPS", "CREATE")
    .input(
      z.object({
        userId: z.string(),
        roleGroupId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(userRoleGroupTable)
        .values({
          userId: input.userId,
          roleGroupId: input.roleGroupId,
        })
        .returning({ id: userRoleGroupTable.id });
      return { id: row!.id };
    }),

  delete: createPermissionProcedure("USER_ROLE_GROUPS", "DELETE")
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(userRoleGroupTable).where(eq(userRoleGroupTable.id, input.id));
      return { id: input.id };
    }),
});
