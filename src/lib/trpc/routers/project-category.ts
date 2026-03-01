import { z } from "zod";
import { eq, count, asc, desc, and, ilike } from "drizzle-orm";
import {
  createTRPCRouter,
  createPermissionProcedure,
} from "@/lib/trpc/trpc";
import { projectCategory, project } from "@/lib/db/schemas";
import { listInputSchema, type ListOutput } from "@/lib/trpc/list-schema";

const ALLOWED_SORT_COLUMNS = ["name", "description", "createdAt"] as const;
const ALLOWED_FILTER_COLUMNS = ["name", "description"] as const;

export const projectCategoryRouter = createTRPCRouter({
  list: createPermissionProcedure("PROJECT_CATEGORY", "READ")
    .input(listInputSchema)
    .query(async ({ ctx, input }): Promise<ListOutput<typeof projectCategory.$inferSelect>> => {
      const { page, limit, sortBy, sortOrder, columnFilters } = input;
      const offset = (page - 1) * limit;

      const conditions = [];
      if (columnFilters) {
        for (const [key, value] of Object.entries(columnFilters)) {
          if (ALLOWED_FILTER_COLUMNS.includes(key as (typeof ALLOWED_FILTER_COLUMNS)[number]) && value.trim()) {
            if (key === "name") {
              conditions.push(ilike(projectCategory.name, `%${value}%`));
            } else if (key === "description") {
              conditions.push(ilike(projectCategory.description, `%${value}%`));
            }
          }
        }
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const totalResult = await ctx.db
        .select({ count: count() })
        .from(projectCategory)
        .where(whereClause);
      const total = totalResult[0]?.count ?? 0;
      const totalPages = Math.ceil(total / limit);

      let orderByClause;
      if (sortBy && ALLOWED_SORT_COLUMNS.includes(sortBy as (typeof ALLOWED_SORT_COLUMNS)[number])) {
        if (sortBy === "name") {
          orderByClause = sortOrder === "desc" ? desc(projectCategory.name) : asc(projectCategory.name);
        } else if (sortBy === "description") {
          orderByClause = sortOrder === "desc" ? desc(projectCategory.description) : asc(projectCategory.description);
        } else if (sortBy === "createdAt") {
          orderByClause = sortOrder === "desc" ? desc(projectCategory.createdAt) : asc(projectCategory.createdAt);
        }
      }
      orderByClause ??= desc(projectCategory.createdAt);

      const items = await ctx.db
        .select()
        .from(projectCategory)
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

  getById: createPermissionProcedure("PROJECT_CATEGORY", "READ")
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(projectCategory)
        .where(eq(projectCategory.id, input.id))
        .limit(1);
      const category = rows[0] ?? null;
      if (!category) return null;

      const relatedProjects = await ctx.db
        .select({ id: project.id, name: project.name })
        .from(project)
        .where(eq(project.categoryId, input.id));

      return { ...category, relatedProjects };
    }),

  create: createPermissionProcedure("PROJECT_CATEGORY", "CREATE")
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(projectCategory)
        .values({
          name: input.name,
          description: input.description,
        })
        .returning({ id: projectCategory.id });
      if (!row) throw new Error("Failed to create project category");
      return { id: row.id };
    }),

  update: createPermissionProcedure("PROJECT_CATEGORY", "UPDATE")
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      await ctx.db
        .update(projectCategory)
        .set({ ...rest, updatedAt: new Date() })
        .where(eq(projectCategory.id, id));
      return { id };
    }),

  delete: createPermissionProcedure("PROJECT_CATEGORY", "DELETE")
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(projectCategory).where(eq(projectCategory.id, input.id));
      return { id: input.id };
    }),
});
