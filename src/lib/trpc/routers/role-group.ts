import { z } from "zod";
import { eq } from "drizzle-orm";
import {
  createTRPCRouter,
  createPermissionProcedure,
} from "@/lib/trpc/trpc";
import { roleGroupTable, roleGroupRoleTable } from "@/lib/db/schemas";

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
