import { z } from "zod";
import { eq, count, asc, desc, and, ilike } from "drizzle-orm";
import {
  createTRPCRouter,
  createPermissionProcedure,
} from "@/lib/trpc/trpc";
import { user as userTable, userRoleTable, roleTable } from "@/lib/db/schemas";
import { listInputSchema, type ListOutput } from "@/lib/trpc/list-schema";

const ALLOWED_SORT_COLUMNS = ["userName", "roleName", "createdAt"] as const;
const ALLOWED_FILTER_COLUMNS = ["userName", "roleName"] as const;

type UserRoleListItem = {
  id: string;
  userId: string;
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
  userName: string;
  roleName: string;
};

export const userRoleRouter = createTRPCRouter({
  list: createPermissionProcedure("USER_ROLES", "READ")
    .input(listInputSchema)
    .query(async ({ ctx, input }): Promise<ListOutput<UserRoleListItem>> => {
      const { page, limit, sortBy, sortOrder, columnFilters } = input;
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [];
      if (columnFilters) {
        for (const [key, value] of Object.entries(columnFilters)) {
          if (ALLOWED_FILTER_COLUMNS.includes(key as typeof ALLOWED_FILTER_COLUMNS[number]) && value.trim()) {
            if (key === "userName") {
              conditions.push(ilike(userTable.name, `%${value}%`));
            } else if (key === "roleName") {
              conditions.push(ilike(roleTable.name, `%${value}%`));
            }
          }
        }
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count (with same joins and filters)
      const countQuery = ctx.db
        .select({ count: count() })
        .from(userRoleTable)
        .innerJoin(userTable, eq(userRoleTable.userId, userTable.id))
        .innerJoin(roleTable, eq(userRoleTable.roleId, roleTable.id))
        .where(whereClause);
      const totalResult = await countQuery;
      const total = totalResult[0]?.count ?? 0;
      const totalPages = Math.ceil(total / limit);

      // Build order by
      let orderByClause;
      if (sortBy && ALLOWED_SORT_COLUMNS.includes(sortBy as typeof ALLOWED_SORT_COLUMNS[number])) {
        if (sortBy === "userName") {
          orderByClause = sortOrder === "desc" ? desc(userTable.name) : asc(userTable.name);
        } else if (sortBy === "roleName") {
          orderByClause = sortOrder === "desc" ? desc(roleTable.name) : asc(roleTable.name);
        } else if (sortBy === "createdAt") {
          orderByClause = sortOrder === "desc" ? desc(userRoleTable.createdAt) : asc(userRoleTable.createdAt);
        }
      }
      // Default order by createdAt desc if no sort specified
      if (!orderByClause) {
        orderByClause = desc(userRoleTable.createdAt);
      }

      // Get paginated items
      const items = await ctx.db
        .select({
          id: userRoleTable.id,
          userId: userRoleTable.userId,
          roleId: userRoleTable.roleId,
          createdAt: userRoleTable.createdAt,
          updatedAt: userRoleTable.updatedAt,
          userName: userTable.name,
          roleName: roleTable.name,
        })
        .from(userRoleTable)
        .innerJoin(userTable, eq(userRoleTable.userId, userTable.id))
        .innerJoin(roleTable, eq(userRoleTable.roleId, roleTable.id))
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

  getById: createPermissionProcedure("USER_ROLES", "READ")
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: userRoleTable.id,
          userId: userRoleTable.userId,
          roleId: userRoleTable.roleId,
          createdAt: userRoleTable.createdAt,
          updatedAt: userRoleTable.updatedAt,
          userName: userTable.name,
          roleName: roleTable.name,
        })
        .from(userRoleTable)
        .innerJoin(userTable, eq(userRoleTable.userId, userTable.id))
        .innerJoin(roleTable, eq(userRoleTable.roleId, roleTable.id))
        .where(eq(userRoleTable.id, input.id))
        .limit(1);
      return rows[0] ?? null;
    }),

  getByUserId: createPermissionProcedure("USER_ROLES", "READ")
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(userRoleTable)
        .where(eq(userRoleTable.userId, input.userId));
    }),

  create: createPermissionProcedure("USER_ROLES", "CREATE")
    .input(
      z.object({
        userId: z.string(),
        roleId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(userRoleTable)
        .values({
          userId: input.userId,
          roleId: input.roleId,
        })
        .returning({ id: userRoleTable.id });
      return { id: row!.id };
    }),

  delete: createPermissionProcedure("USER_ROLES", "DELETE")
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(userRoleTable).where(eq(userRoleTable.id, input.id));
      return { id: input.id };
    }),
});
