import { z } from "zod";
import { eq } from "drizzle-orm";
import {
  createTRPCRouter,
  createPermissionProcedure,
} from "@/lib/trpc/trpc";
import { posts } from "@/lib/db/schemas";

export const postRouter = createTRPCRouter({
  list: createPermissionProcedure("POST", "READ").query(async ({ ctx }) => {
    return ctx.db.select().from(posts);
  }),

  getById: createPermissionProcedure("POST", "READ")
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(posts)
        .where(eq(posts.id, input.id))
        .limit(1);
      return rows[0] ?? null;
    }),

  create: createPermissionProcedure("POST", "CREATE")
    .input(
      z.object({
        name: z.string().min(1),
        userId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = input.userId ?? ctx.session!.user.id;
      const [row] = await ctx.db
        .insert(posts)
        .values({
          name: input.name,
          userId,
        })
        .returning({ id: posts.id });
      return { id: row!.id };
    }),

  update: createPermissionProcedure("POST", "UPDATE")
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      await ctx.db
        .update(posts)
        .set({ ...rest, updatedAt: new Date() })
        .where(eq(posts.id, id));
      return { id };
    }),

  delete: createPermissionProcedure("POST", "DELETE")
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(posts).where(eq(posts.id, input.id));
      return { id: input.id };
    }),
});
