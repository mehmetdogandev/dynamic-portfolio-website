import { z } from "zod";
import { eq } from "drizzle-orm";
import {
  createTRPCRouter,
  createPermissionProcedure,
} from "@/lib/trpc/trpc";
import { roleGroupTable } from "@/lib/db/schemas";

export const roleGroupRouter = createTRPCRouter({
  list: createPermissionProcedure("ROLE_GROUPS", "READ").query(async ({ ctx }) => {
    return ctx.db.select().from(roleGroupTable);
  }),

  getById: createPermissionProcedure("ROLE_GROUPS", "READ")
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(roleGroupTable)
        .where(eq(roleGroupTable.id, input.id))
        .limit(1);
      return rows[0] ?? null;
    }),

  create: createPermissionProcedure("ROLE_GROUPS", "CREATE")
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        roleId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(roleGroupTable)
        .values({
          name: input.name,
          description: input.description,
          roleId: input.roleId,
        })
        .returning({ id: roleGroupTable.id });
      return { id: row!.id };
    }),

  update: createPermissionProcedure("ROLE_GROUPS", "UPDATE")
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        roleId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, description, roleId } = input;
      await ctx.db
        .update(roleGroupTable)
        .set({
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(roleId !== undefined && { roleId }),
          updatedAt: new Date(),
        })
        .where(eq(roleGroupTable.id, id));
      return { id };
    }),

  delete: createPermissionProcedure("ROLE_GROUPS", "DELETE")
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(roleGroupTable).where(eq(roleGroupTable.id, input.id));
      return { id: input.id };
    }),
});
