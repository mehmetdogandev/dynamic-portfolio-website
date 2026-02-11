import { z } from "zod";

export const listInputSchema = z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(10),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    columnFilters: z.record(z.string(), z.string()).optional(),
});

export type ListInput = z.infer<typeof listInputSchema>;

export interface ListOutput<T> {
    items: T[];
    total: number;
    totalPages: number;
}
