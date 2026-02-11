import { z } from "zod";
import { eq } from "drizzle-orm";
import {
  createTRPCRouter,
  createPermissionProcedure,
} from "@/lib/trpc/trpc";
import { userRoleTable } from "@/lib/db/schemas";

export const userRoleRouter = createTRPCRouter({
  list: createPermissionProcedure("USER_ROLES", "READ").query(async ({ ctx }) => {
    return ctx.db.select().from(userRoleTable);
  }),

  getById: createPermissionProcedure("USER_ROLES", "READ")
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(userRoleTable)
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
