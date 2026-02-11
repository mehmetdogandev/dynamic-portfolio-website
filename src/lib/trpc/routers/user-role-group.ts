import { z } from "zod";
import { eq } from "drizzle-orm";
import {
  createTRPCRouter,
  createPermissionProcedure,
} from "@/lib/trpc/trpc";
import { userRoleGroupTable } from "@/lib/db/schemas";

export const userRoleGroupRouter = createTRPCRouter({
  list: createPermissionProcedure("USER_ROLE_GROUPS", "READ").query(async ({ ctx }) => {
    return ctx.db.select().from(userRoleGroupTable);
  }),

  getById: createPermissionProcedure("USER_ROLE_GROUPS", "READ")
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(userRoleGroupTable)
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
