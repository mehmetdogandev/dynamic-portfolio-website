import { z } from "zod";
import { eq } from "drizzle-orm";
import {
  createTRPCRouter,
  createPermissionProcedure,
} from "@/lib/trpc/trpc";
import { logo } from "@/lib/db/schemas";

const logoStatusSchema = z.enum(["ACTIVE", "PASSIVE"]);

export const logoRouter = createTRPCRouter({
  list: createPermissionProcedure("LOGO", "READ").query(async ({ ctx }) => {
    return ctx.db.select().from(logo);
  }),

  getById: createPermissionProcedure("LOGO", "READ")
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(logo)
        .where(eq(logo.id, input.id))
        .limit(1);
      return rows[0] ?? null;
    }),

  getActive: createPermissionProcedure("LOGO", "READ").query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(logo)
      .where(eq(logo.status, "ACTIVE"))
      .limit(1);
    return rows[0] ?? null;
  }),

  create: createPermissionProcedure("LOGO", "CREATE")
    .input(
      z.object({
        name: z.string().min(1),
        path: z.string().min(1),
        status: logoStatusSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(logo)
        .values({
          name: input.name,
          path: input.path,
          status: input.status ?? "ACTIVE",
        })
        .returning({ id: logo.id });
      return { id: row!.id };
    }),

  update: createPermissionProcedure("LOGO", "UPDATE")
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        path: z.string().min(1).optional(),
        status: logoStatusSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      await ctx.db
        .update(logo)
        .set({ ...rest, updatedAt: new Date() })
        .where(eq(logo.id, id));
      return { id };
    }),

  delete: createPermissionProcedure("LOGO", "DELETE")
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(logo).where(eq(logo.id, input.id));
      return { id: input.id };
    }),

  setActive: createPermissionProcedure("LOGO", "UPDATE")
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(logo)
        .set({ status: "PASSIVE", updatedAt: new Date() });
      await ctx.db
        .update(logo)
        .set({ status: "ACTIVE", updatedAt: new Date() })
        .where(eq(logo.id, input.id));
      return { id: input.id };
    }),
});
