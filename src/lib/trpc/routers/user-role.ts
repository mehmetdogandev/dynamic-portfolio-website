import { z } from "zod";
import { eq } from "drizzle-orm";
import {
  createTRPCRouter,
  createPermissionProcedure,
} from "@/lib/trpc/trpc";
import { user as userTable, userRoleTable, roleTable } from "@/lib/db/schemas";

export const userRoleRouter = createTRPCRouter({
  list: createPermissionProcedure("USER_ROLES", "READ").query(async ({ ctx }) => {
    return ctx.db
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
      .innerJoin(roleTable, eq(userRoleTable.roleId, roleTable.id));
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
