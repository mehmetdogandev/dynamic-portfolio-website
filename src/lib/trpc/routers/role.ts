import { z } from "zod";
import { eq } from "drizzle-orm";
import {
  createTRPCRouter,
  createPermissionProcedure,
} from "@/lib/trpc/trpc";
import type { Permission } from "@/lib/rbac/permissions";
import { roleTable } from "@/lib/db/schemas";

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

export const roleRouter = createTRPCRouter({
  list: createPermissionProcedure("ROLES", "READ").query(async ({ ctx }) => {
    return ctx.db.select().from(roleTable);
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
