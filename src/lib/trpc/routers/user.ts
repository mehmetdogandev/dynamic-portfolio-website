import { z } from "zod";
import { eq } from "drizzle-orm";
import {
  createTRPCRouter,
  createPermissionProcedure,
} from "@/lib/trpc/trpc";
import { user as userTable } from "@/lib/db/schemas";

export const userRouter = createTRPCRouter({
  list: createPermissionProcedure("USERS", "READ").query(async ({ ctx }) => {
    return ctx.db.select().from(userTable);
  }),

  getById: createPermissionProcedure("USERS", "READ")
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(userTable)
        .where(eq(userTable.id, input.id))
        .limit(1);
      return rows[0] ?? null;
    }),

  create: createPermissionProcedure("USERS", "CREATE")
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Better Auth manages user creation; use auth.api or server action for full signup.
      // For now we only allow listing/update/delete via tRPC; create can be done via auth signUp or admin API.
      const id = crypto.randomUUID();
      await ctx.db.insert(userTable).values({
        id,
        name: input.name,
        email: input.email,
        emailVerified: false,
      });
      return { id };
    }),

  update: createPermissionProcedure("USERS", "UPDATE")
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      await ctx.db
        .update(userTable)
        .set({ ...rest, updatedAt: new Date() })
        .where(eq(userTable.id, id));
      return { id };
    }),

  delete: createPermissionProcedure("USERS", "DELETE")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(userTable).where(eq(userTable.id, input.id));
      return { id: input.id };
    }),
});
